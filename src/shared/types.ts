export type CardType = 'basic' | 'cloze' | 'image';

export type Deck = {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: number;
};

export type Card = {
  id: string;
  deckId: string;
  type: CardType;
  front: string;
  back: string;
  clozeText: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type Scheduling = {
  cardId: string;
  n: number;
  intervalDays: number;
  ef: number;
  dueAt: number;
  lastReviewedAt: number | null;
};

export type CardWithScheduling = Card & { scheduling: Scheduling };

export type ReviewLog = {
  id: string;
  cardId: string;
  reviewedAt: number;
  q: number;
  prevDueAt: number | null;
  newDueAt: number | null;
  durationMs: number | null;
};

export type CreateDeckInput = {
  name?: string;
  parentId?: string | null;
  path?: string;
};

export type CreateCardInput = {
  deckId: string;
  type?: CardType;
  front: string;
  back: string;
  clozeText?: string | null;
  tags?: string[];
};

export type UpdateCardInput = {
  id: string;
  front: string;
  back: string;
  tags?: string[];
};

export type ReviewInput = {
  cardId: string;
  q: number;
  durationMs?: number | null;
};

export type Stats = {
  dueNow: number;
  dueToday: number;
  reviewsToday: number;
  streakDays: number;
  retention: number;
  totalCards: number;
  reviewedCards: number;
  deckProgress: number;
};

export type ReviewSession = {
  id: string;
  deckId: string | null;
  startedAt: number;
  endedAt: number | null;
  cardsReviewed: number;
  cardsRepeated: number;
};

export type NextReviewInfo = {
  nextDueAt: number | null;
  nextDueCardCount: number;
  formattedTime: string;
};

export type MoveDeckInput = {
  deckId: string;
  newParentId: string | null;
};

export type DeleteDeckInput = {
  deckId: string;
  mode: 'cascade' | 'reparent';
};

export type DeckDeletePreview = {
  deckName: string;
  childDeckCount: number;
  totalCardCount: number;
  affectedDeckNames: string[];
};

export type CardCrafterAPI = {
  listDecks: () => Promise<Deck[]>;
  createDeck: (input: CreateDeckInput) => Promise<Deck>;
  listCards: (deckId: string) => Promise<Card[]>;
  createCard: (input: CreateCardInput) => Promise<Card>;
  updateCard: (input: UpdateCardInput) => Promise<Card>;
  getDueCard: (deckId?: string | null) => Promise<CardWithScheduling | null>;
  reviewCard: (input: ReviewInput) => Promise<Scheduling>;
  snoozeCard: (cardId: string, minutes?: number) => Promise<Scheduling>;
  getStats: (deckId?: string | null) => Promise<Stats>;
  startReviewSession: (deckId?: string | null) => Promise<ReviewSession>;
  endReviewSession: (sessionId: string) => Promise<ReviewSession>;
  getNextReviewInfo: (deckId?: string | null) => Promise<NextReviewInfo>;
  getDueCardWithPriority: (
    deckId?: string | null,
    poorCardIds?: string[],
  ) => Promise<CardWithScheduling | null>;
  moveDeck: (input: MoveDeckInput) => Promise<Deck>;
  deleteDeck: (input: DeleteDeckInput) => Promise<void>;
  getDeletePreview: (deckId: string) => Promise<DeckDeletePreview>;
};
