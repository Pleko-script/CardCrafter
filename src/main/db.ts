import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

import type {
  Card,
  CardType,
  CardWithScheduling,
  CreateCardInput,
  CreateDeckInput,
  Deck,
  DeckDeletePreview,
  MoveDeckInput,
  NextReviewInfo,
  ReviewSession,
  Scheduling,
  Stats,
} from '../shared/types';
import { computeNextSchedule, snoozeSchedule } from './scheduler';

type DbCardRow = {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  clozeText: string | null;
  tagsJson: string;
  createdAt: number;
  updatedAt: number;
};

type DbSchedulingRow = {
  cardId: string;
  n: number;
  intervalDays: number;
  ef: number;
  dueAt: number;
  lastReviewedAt: number | null;
};

type DbCardWithScheduleRow = DbCardRow & DbSchedulingRow;

const DAY_MS = 24 * 60 * 60 * 1000;

export class CardCrafterDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.ensureSchema();
    this.ensureSessionSchema();
    this.ensureDefaultDeck();
  }

  private ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        parentId TEXT REFERENCES decks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_decks_parent ON decks(parentId);
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        deckId TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        clozeText TEXT,
        tagsJson TEXT NOT NULL DEFAULT '[]',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deckId);
      CREATE TABLE IF NOT EXISTS scheduling (
        cardId TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
        n INTEGER NOT NULL,
        intervalDays INTEGER NOT NULL,
        ef REAL NOT NULL,
        dueAt INTEGER NOT NULL,
        lastReviewedAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_scheduling_due ON scheduling(dueAt);
      CREATE TABLE IF NOT EXISTS review_logs (
        id TEXT PRIMARY KEY,
        cardId TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        reviewedAt INTEGER NOT NULL,
        q INTEGER NOT NULL,
        prevDueAt INTEGER,
        newDueAt INTEGER,
        durationMs INTEGER
      );
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        filePath TEXT NOT NULL,
        title TEXT,
        importedAt INTEGER NOT NULL,
        extractedText TEXT
      );
      CREATE TABLE IF NOT EXISTS card_sources (
        cardId TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        sourceId TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        PRIMARY KEY (cardId, sourceId)
      );
    `);
  }

  private ensureSessionSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS review_sessions (
        id TEXT PRIMARY KEY,
        deckId TEXT REFERENCES decks(id) ON DELETE CASCADE,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        cardsReviewed INTEGER NOT NULL DEFAULT 0,
        cardsRepeated INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_deck ON review_sessions(deckId);
    `);
  }

  private ensureDefaultDeck() {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM decks').get() as {
      count: number;
    };
    if (row.count === 0) {
      const now = Date.now();
      this.db
        .prepare(
          'INSERT INTO decks (id, parentId, name, createdAt) VALUES (?, ?, ?, ?)',
        )
        .run(randomUUID(), null, 'Inbox', now);
    }
  }

  listDecks(): Deck[] {
    const rows = this.db
      .prepare('SELECT id, parentId, name, createdAt FROM decks ORDER BY name')
      .all() as Deck[];
    return rows;
  }

  createDeck(input: CreateDeckInput): Deck {
    const trimmedName = input.name?.trim();
    const trimmedPath = input.path?.trim();

    if (trimmedPath) {
      const fullPath = trimmedName
        ? `${trimmedPath.replace(/\/+$/, '')}/${trimmedName}`
        : trimmedPath;
      return this.createDeckPath(fullPath);
    }

    if (!trimmedName) {
      throw new Error('Deck name is required');
    }

    const now = Date.now();
    const deck: Deck = {
      id: randomUUID(),
      parentId: input.parentId ?? null,
      name: trimmedName,
      createdAt: now,
    };
    this.db
      .prepare(
        'INSERT INTO decks (id, parentId, name, createdAt) VALUES (?, ?, ?, ?)',
      )
      .run(deck.id, deck.parentId, deck.name, deck.createdAt);
    return deck;
  }

  private createDeckPath(path: string): Deck {
    const segments = path
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length === 0) {
      throw new Error('Deck path is empty');
    }

    let parentId: string | null = null;
    let deck: Deck | null = null;

    const select = this.db.prepare(
      'SELECT id, parentId, name, createdAt FROM decks WHERE name = ? AND parentId IS ?',
    );
    const insert = this.db.prepare(
      'INSERT INTO decks (id, parentId, name, createdAt) VALUES (?, ?, ?, ?)',
    );

    for (const name of segments) {
      const existing = select.get(name, parentId) as Deck | undefined;
      if (existing) {
        deck = existing;
        parentId = existing.id;
        continue;
      }
      const now = Date.now();
      const newDeck: Deck = {
        id: randomUUID(),
        parentId,
        name,
        createdAt: now,
      };
      insert.run(newDeck.id, newDeck.parentId, newDeck.name, newDeck.createdAt);
      deck = newDeck;
      parentId = newDeck.id;
    }

    return deck!;
  }

  listCards(deckId: string): Card[] {
    const rows = this.db
      .prepare(
        'SELECT id, deckId, type, front, back, clozeText, tagsJson, createdAt, updatedAt FROM cards WHERE deckId = ? ORDER BY createdAt DESC',
      )
      .all(deckId) as DbCardRow[];
    return rows.map((row) => this.mapCard(row));
  }

  createCard(input: CreateCardInput): Card {
    const now = Date.now();
    const card: Card = {
      id: randomUUID(),
      deckId: input.deckId,
      type: input.type ?? 'basic',
      front: input.front.trim(),
      back: input.back.trim(),
      clozeText: input.clozeText ?? null,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO cards (id, deckId, type, front, back, clozeText, tagsJson, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        card.id,
        card.deckId,
        card.type,
        card.front,
        card.back,
        card.clozeText,
        JSON.stringify(card.tags),
        card.createdAt,
        card.updatedAt,
      );
    const schedule: Scheduling = {
      cardId: card.id,
      n: 0,
      intervalDays: 0,
      ef: 2.5,
      dueAt: now,
      lastReviewedAt: null,
    };
    this.db
      .prepare(
        'INSERT INTO scheduling (cardId, n, intervalDays, ef, dueAt, lastReviewedAt) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        schedule.cardId,
        schedule.n,
        schedule.intervalDays,
        schedule.ef,
        schedule.dueAt,
        schedule.lastReviewedAt,
      );

    return card;
  }

  getDueCard(deckId?: string | null): CardWithScheduling | null {
    const now = Date.now();
    const row = this.db
      .prepare(
        `SELECT c.id, c.deckId, c.type, c.front, c.back, c.clozeText, c.tagsJson,
                c.createdAt, c.updatedAt,
                s.cardId, s.n, s.intervalDays, s.ef, s.dueAt, s.lastReviewedAt
         FROM cards c
         JOIN scheduling s ON s.cardId = c.id
         WHERE s.dueAt <= ? AND (? IS NULL OR c.deckId = ?)
         ORDER BY s.dueAt ASC
         LIMIT 1`,
      )
      .get(now, deckId ?? null, deckId ?? null) as DbCardWithScheduleRow | undefined;

    if (!row) {
      return null;
    }
    return this.mapCardWithSchedule(row);
  }

  reviewCard(cardId: string, q: number, durationMs?: number | null): Scheduling {
    const current = this.getSchedule(cardId);
    const now = Date.now();
    const next = computeNextSchedule({ current, q, now });

    this.db
      .prepare(
        `UPDATE scheduling
         SET n = ?, intervalDays = ?, ef = ?, dueAt = ?, lastReviewedAt = ?
         WHERE cardId = ?`,
      )
      .run(
        next.n,
        next.intervalDays,
        next.ef,
        next.dueAt,
        next.lastReviewedAt,
        cardId,
      );

    this.db
      .prepare(
        `INSERT INTO review_logs (id, cardId, reviewedAt, q, prevDueAt, newDueAt, durationMs)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        randomUUID(),
        cardId,
        now,
        q,
        current.dueAt,
        next.dueAt,
        durationMs ?? null,
      );

    return next;
  }

  snoozeCard(cardId: string, minutes = 10): Scheduling {
    const current = this.getSchedule(cardId);
    const now = Date.now();
    const next = snoozeSchedule(current, minutes, now);
    this.db
      .prepare('UPDATE scheduling SET dueAt = ? WHERE cardId = ?')
      .run(next.dueAt, cardId);
    return next;
  }

  getStats(deckId?: string | null): Stats {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = startOfDay.getTime() + DAY_MS;

    const dueNow = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM scheduling s
         JOIN cards c ON c.id = s.cardId
         WHERE s.dueAt <= ? AND (? IS NULL OR c.deckId = ?)`,
      )
      .get(now, deckId ?? null, deckId ?? null) as { count: number };

    const dueToday = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM scheduling s
         JOIN cards c ON c.id = s.cardId
         WHERE s.dueAt <= ? AND (? IS NULL OR c.deckId = ?)`,
      )
      .get(endOfDay, deckId ?? null, deckId ?? null) as { count: number };

    const reviewsToday = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM review_logs r
         JOIN cards c ON c.id = r.cardId
         WHERE r.reviewedAt >= ? AND (? IS NULL OR c.deckId = ?)`,
      )
      .get(startOfDay.getTime(), deckId ?? null, deckId ?? null) as {
      count: number;
    };

    const totalCards = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM cards WHERE (? IS NULL OR deckId = ?)`,
      )
      .get(deckId ?? null, deckId ?? null) as { count: number };

    const reviewedCards = this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM scheduling s
         JOIN cards c ON c.id = s.cardId
         WHERE s.n > 0 AND (? IS NULL OR c.deckId = ?)`,
      )
      .get(deckId ?? null, deckId ?? null) as { count: number };

    const retentionRow = this.db
      .prepare(
        `SELECT
            SUM(CASE WHEN q >= 3 THEN 1 ELSE 0 END) as good,
            COUNT(*) as total
         FROM (
           SELECT r.q
           FROM review_logs r
           JOIN cards c ON c.id = r.cardId
           WHERE (? IS NULL OR c.deckId = ?)
           ORDER BY r.reviewedAt DESC
           LIMIT 100
         )`,
      )
      .get(deckId ?? null, deckId ?? null) as { good: number; total: number };

    const retention =
      retentionRow.total > 0 ? retentionRow.good / retentionRow.total : 0;

    const streakDays = this.computeStreak(deckId ?? null);

    const deckProgress =
      totalCards.count > 0
        ? Math.round((reviewedCards.count / totalCards.count) * 100)
        : 0;

    return {
      dueNow: dueNow.count,
      dueToday: dueToday.count,
      reviewsToday: reviewsToday.count,
      streakDays,
      retention,
      totalCards: totalCards.count,
      reviewedCards: reviewedCards.count,
      deckProgress,
    };
  }

  private getSchedule(cardId: string): Scheduling {
    const row = this.db
      .prepare(
        'SELECT cardId, n, intervalDays, ef, dueAt, lastReviewedAt FROM scheduling WHERE cardId = ?',
      )
      .get(cardId) as DbSchedulingRow | undefined;
    if (!row) {
      throw new Error('Scheduling not found');
    }
    return row;
  }

  private mapCard(row: DbCardRow): Card {
    return {
      id: row.id,
      deckId: row.deckId,
      type: row.type,
      front: row.front,
      back: row.back,
      clozeText: row.clozeText ?? null,
      tags: safeJsonArray(row.tagsJson),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapCardWithSchedule(row: DbCardWithScheduleRow): CardWithScheduling {
    return {
      ...this.mapCard(row),
      scheduling: {
        cardId: row.cardId,
        n: row.n,
        intervalDays: row.intervalDays,
        ef: row.ef,
        dueAt: row.dueAt,
        lastReviewedAt: row.lastReviewedAt ?? null,
      },
    };
  }

  private computeStreak(deckId: string | null): number {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT date(datetime(reviewedAt / 1000, 'unixepoch')) as day
         FROM review_logs r
         JOIN cards c ON c.id = r.cardId
         WHERE (? IS NULL OR c.deckId = ?)
         ORDER BY day DESC`,
      )
      .all(deckId, deckId) as { day: string }[];

    if (rows.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const row of rows) {
      const day = new Date(`${row.day}T00:00:00`);
      const diffDays = Math.round((today.getTime() - day.getTime()) / DAY_MS);
      if (diffDays === streak) {
        streak += 1;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }

  // Session Management
  startReviewSession(deckId: string | null): ReviewSession {
    const session: ReviewSession = {
      id: randomUUID(),
      deckId,
      startedAt: Date.now(),
      endedAt: null,
      cardsReviewed: 0,
      cardsRepeated: 0,
    };
    this.db
      .prepare(
        'INSERT INTO review_sessions (id, deckId, startedAt, endedAt, cardsReviewed, cardsRepeated) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        session.id,
        session.deckId,
        session.startedAt,
        session.endedAt,
        session.cardsReviewed,
        session.cardsRepeated,
      );
    return session;
  }

  endReviewSession(sessionId: string): ReviewSession {
    const now = Date.now();
    this.db
      .prepare('UPDATE review_sessions SET endedAt = ? WHERE id = ?')
      .run(now, sessionId);
    const row = this.db
      .prepare('SELECT * FROM review_sessions WHERE id = ?')
      .get(sessionId) as ReviewSession;
    return row;
  }

  // Next Review Info
  getNextReviewInfo(deckId: string | null): NextReviewInfo {
    const now = Date.now();
    const row = this.db
      .prepare(
        `
      SELECT MIN(s.dueAt) as nextDueAt, COUNT(*) as count
      FROM scheduling s
      JOIN cards c ON c.id = s.cardId
      WHERE s.dueAt > ? AND (? IS NULL OR c.deckId = ?)
    `,
      )
      .get(now, deckId, deckId) as { nextDueAt: number | null; count: number };

    if (!row.nextDueAt) {
      return {
        nextDueAt: null,
        nextDueCardCount: 0,
        formattedTime: 'Keine anstehenden Reviews',
      };
    }

    const formattedTime = this.formatNextReviewTime(row.nextDueAt);
    return {
      nextDueAt: row.nextDueAt,
      nextDueCardCount: row.count,
      formattedTime,
    };
  }

  private formatNextReviewTime(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (minutes < 1) return 'jetzt';
    if (minutes < 60) return `in ${minutes} Minuten`;
    if (hours < 24) return `in ${hours} Stunden`;
    if (days === 1) return 'morgen';
    return `in ${days} Tagen`;
  }

  // Priority Card Loading (poor cards first)
  getDueCardWithPriority(
    deckId: string | null,
    poorCardIds: string[],
  ): CardWithScheduling | null {
    // Zuerst versuchen, eine Poor Card zu laden
    if (poorCardIds.length > 0) {
      const placeholders = poorCardIds.map(() => '?').join(',');
      const deckFilter = deckId ? 'AND c.deckId = ?' : '';
      const params = deckId ? [...poorCardIds, deckId] : poorCardIds;

      const row = this.db
        .prepare(
          `
        SELECT c.id, c.deckId, c.type, c.front, c.back, c.clozeText, c.tagsJson,
               c.createdAt, c.updatedAt,
               s.cardId, s.n, s.intervalDays, s.ef, s.dueAt, s.lastReviewedAt
        FROM cards c
        JOIN scheduling s ON s.cardId = c.id
        WHERE c.id IN (${placeholders}) ${deckFilter}
        ORDER BY RANDOM()
        LIMIT 1
      `,
        )
        .get(...params) as DbCardWithScheduleRow | undefined;

      if (row) return this.mapCardWithSchedule(row);
    }

    // Fallback auf normale Due Card
    return this.getDueCard(deckId);
  }

  // Deck Management
  moveDeck(deckId: string, newParentId: string | null): Deck {
    // Validierung: Deck existiert
    const deck = this.db
      .prepare('SELECT * FROM decks WHERE id = ?')
      .get(deckId) as Deck | undefined;
    if (!deck) {
      throw new Error('Deck not found');
    }

    // Verhindere Circular Reference
    if (deckId === newParentId) {
      throw new Error('Cannot move deck into itself');
    }

    if (newParentId && this.isDescendant(deckId, newParentId)) {
      throw new Error('Cannot move deck into its own descendant');
    }

    // Validiere Parent existiert
    if (newParentId) {
      const parent = this.db
        .prepare('SELECT * FROM decks WHERE id = ?')
        .get(newParentId);
      if (!parent) {
        throw new Error('Target parent deck not found');
      }
    }

    // Move durchführen
    this.db
      .prepare('UPDATE decks SET parentId = ? WHERE id = ?')
      .run(newParentId, deckId);

    return this.db
      .prepare('SELECT * FROM decks WHERE id = ?')
      .get(deckId) as Deck;
  }

  private isDescendant(ancestorId: string, potentialDescendantId: string): boolean {
    let current = potentialDescendantId;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current)) return false; // Cycle detection
      visited.add(current);

      if (current === ancestorId) return true;

      const deck = this.db
        .prepare('SELECT parentId FROM decks WHERE id = ?')
        .get(current) as { parentId: string | null } | undefined;
      if (!deck || !deck.parentId) return false;
      current = deck.parentId;
    }

    return false;
  }

  getDeletePreview(deckId: string): DeckDeletePreview {
    const deck = this.db
      .prepare('SELECT name FROM decks WHERE id = ?')
      .get(deckId) as { name: string } | undefined;
    if (!deck) {
      throw new Error('Deck not found');
    }

    // Descendant IDs sammeln
    const descendantIds = this.getDescendantIds(deckId);
    const allAffectedIds = [deckId, ...descendantIds];

    // Child Count (direkte Children)
    const childCount = this.db
      .prepare('SELECT COUNT(*) as count FROM decks WHERE parentId = ?')
      .get(deckId) as { count: number };

    // Affected Deck Names
    const placeholders = allAffectedIds.map(() => '?').join(',');
    const affectedDecks = this.db
      .prepare(`SELECT name FROM decks WHERE id IN (${placeholders})`)
      .all(...allAffectedIds) as { name: string }[];

    // Total Card Count
    const cardCount = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM cards WHERE deckId IN (${placeholders})`,
      )
      .get(...allAffectedIds) as { count: number };

    return {
      deckName: deck.name,
      childDeckCount: childCount.count,
      totalCardCount: cardCount.count,
      affectedDeckNames: affectedDecks.map((d) => d.name),
    };
  }

  private getDescendantIds(deckId: string): string[] {
    const result: string[] = [];
    const queue: string[] = [deckId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const children = this.db
        .prepare('SELECT id FROM decks WHERE parentId = ?')
        .all(current) as { id: string }[];
      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }

    return result;
  }

  deleteDeck(deckId: string, mode: 'cascade' | 'reparent'): void {
    const deck = this.db
      .prepare('SELECT parentId FROM decks WHERE id = ?')
      .get(deckId) as { parentId: string | null } | undefined;
    if (!deck) {
      throw new Error('Deck not found');
    }

    if (mode === 'reparent') {
      // Children eine Ebene hochschieben
      this.db
        .prepare('UPDATE decks SET parentId = ? WHERE parentId = ?')
        .run(deck.parentId, deckId);
    }

    // Deck löschen (CASCADE handled children in DB if mode === 'cascade')
    this.db.prepare('DELETE FROM decks WHERE id = ?').run(deckId);
  }
}

function safeJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
