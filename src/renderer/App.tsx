import React from 'react';
import {
  BookOpen,
  ChevronDown,
  FileText,
  FolderTree,
  Import,
  LayoutGrid,
  Plus,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react';

import type { Card, CardWithScheduling, Deck, Stats } from '../shared/types';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card as CardShell } from './components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Textarea } from './components/ui/textarea';
import { cn } from './lib/utils';

type DeckNode = Deck & { children: DeckNode[] };

const emptyStats: Stats = {
  dueNow: 0,
  dueToday: 0,
  reviewsToday: 0,
  streakDays: 0,
  retention: 0,
  totalCards: 0,
  reviewedCards: 0,
  deckProgress: 0,
};

function buildDeckTree(decks: Deck[]): DeckNode[] {
  const map = new Map<string, DeckNode>();
  for (const deck of decks) {
    map.set(deck.id, { ...deck, children: [] });
  }
  const roots: DeckNode[] = [];
  for (const deck of map.values()) {
    if (deck.parentId && map.has(deck.parentId)) {
      map.get(deck.parentId)!.children.push(deck);
    } else {
      roots.push(deck);
    }
  }
  const sortNodes = (nodes: DeckNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
}

function DeckTreeItem({
  node,
  level,
  selectedId,
  onSelect,
}: {
  node: DeckNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted',
          selectedId === node.id && 'bg-secondary text-foreground',
        )}
        style={{ paddingLeft: 12 + level * 14 }}
        onClick={() => onSelect(node.id)}
        aria-current={selectedId === node.id ? 'page' : undefined}
      >
        {hasChildren && (
          <span
            className={cn(
              'text-muted-foreground transition',
              open ? 'rotate-90' : '',
            )}
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
        )}
        <FolderTree size={16} className="text-muted-foreground" />
        <span className="flex-1">{node.name}</span>
        {hasChildren && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              setOpen((prev) => !prev);
            }}
            aria-label={open ? 'Unterdecks einklappen' : 'Unterdecks ausklappen'}
          >
            {open ? '–' : '+'}
          </button>
        )}
      </button>
      {hasChildren && open && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <DeckTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [activeTab, setActiveTab] = React.useState('review');
  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = React.useState<string | null>(null);
  const [cards, setCards] = React.useState<Card[]>([]);
  const [dueCard, setDueCard] = React.useState<CardWithScheduling | null>(null);
  const [stats, setStats] = React.useState<Stats>(emptyStats);
  const [reviewFlipped, setReviewFlipped] = React.useState(false);
  const [deckName, setDeckName] = React.useState('');
  const [deckPath, setDeckPath] = React.useState('');
  const [cardFront, setCardFront] = React.useState('');
  const [cardBack, setCardBack] = React.useState('');
  const [cardTags, setCardTags] = React.useState('');
  const [loading, setLoading] = React.useState({
    decks: false,
    cards: false,
    due: false,
  });

  const deckTree = React.useMemo(() => buildDeckTree(decks), [decks]);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;

  const loadDecks = React.useCallback(async () => {
    setLoading((prev) => ({ ...prev, decks: true }));
    const list = await window.cardcrafter.listDecks();
    setDecks(list);
    setSelectedDeckId((current) => current ?? list[0]?.id ?? null);
    setLoading((prev) => ({ ...prev, decks: false }));
  }, []);

  const loadCards = React.useCallback(
    async (deckId: string) => {
      setLoading((prev) => ({ ...prev, cards: true }));
      const list = await window.cardcrafter.listCards(deckId);
      setCards(list);
      setLoading((prev) => ({ ...prev, cards: false }));
    },
    [],
  );

  const loadDueCard = React.useCallback(
    async (deckId: string | null) => {
      setLoading((prev) => ({ ...prev, due: true }));
      const next = await window.cardcrafter.getDueCard(deckId);
      setDueCard(next);
      setReviewFlipped(false);
      setLoading((prev) => ({ ...prev, due: false }));
    },
    [],
  );

  const loadStats = React.useCallback(async (deckId: string | null) => {
    const data = await window.cardcrafter.getStats(deckId);
    setStats(data);
  }, []);

  React.useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  React.useEffect(() => {
    if (!selectedDeckId) return;
    loadCards(selectedDeckId);
    loadDueCard(selectedDeckId);
    loadStats(selectedDeckId);
  }, [selectedDeckId, loadCards, loadDueCard, loadStats]);

  const handleCreateDeck = async () => {
    if (!deckName.trim() && !deckPath.trim()) return;
    const created = await window.cardcrafter.createDeck({
      name: deckName.trim() || undefined,
      parentId: deckPath.trim() ? undefined : selectedDeckId,
      path: deckPath.trim() || undefined,
    });
    setDeckName('');
    setDeckPath('');
    await loadDecks();
    setSelectedDeckId(created.id);
  };

  const handleCreateCard = async () => {
    if (!selectedDeckId) return;
    if (!cardFront.trim() || !cardBack.trim()) return;
    const tags = cardTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await window.cardcrafter.createCard({
      deckId: selectedDeckId,
      front: cardFront,
      back: cardBack,
      tags,
    });
    setCardFront('');
    setCardBack('');
    setCardTags('');
    await loadCards(selectedDeckId);
    await loadDueCard(selectedDeckId);
    await loadStats(selectedDeckId);
    setActiveTab('review');
  };

  const handleReview = React.useCallback(
    async (q: number) => {
      if (!dueCard) return;
      await window.cardcrafter.reviewCard({
        cardId: dueCard.id,
        q,
        durationMs: null,
      });
      if (selectedDeckId) {
        await loadDueCard(selectedDeckId);
        await loadStats(selectedDeckId);
      }
    },
    [dueCard, selectedDeckId, loadDueCard, loadStats],
  );

  const handleSnooze = React.useCallback(async () => {
    if (!dueCard) return;
    await window.cardcrafter.snoozeCard(dueCard.id, 10);
    if (selectedDeckId) {
      await loadDueCard(selectedDeckId);
      await loadStats(selectedDeckId);
    }
  }, [dueCard, selectedDeckId, loadDueCard, loadStats]);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        setReviewFlipped((prev) => !prev);
        return;
      }
      if (event.key >= '0' && event.key <= '5') {
        handleReview(Number(event.key));
      }
      if (event.key.toLowerCase() === 's') {
        handleSnooze();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleReview, handleSnooze]);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-foreground">
      <aside className="flex h-full w-[280px] min-w-[220px] max-w-[420px] flex-shrink-0 resize-x flex-col gap-4 border-r border-border bg-background/70 p-4 backdrop-blur-xl">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            CardCrafter
          </h1>
          <p className="text-sm text-muted-foreground">
            Lernen mit System &amp; Sinn.
          </p>
        </div>

        <Input placeholder="Decks durchsuchen..." />

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1">
                <Plus size={16} /> Deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Deck</DialogTitle>
                <DialogDescription>
                  Erstelle ein neues Deck oder Unterdeck.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Deck-Name"
                  value={deckName}
                  onChange={(event) => setDeckName(event.target.value)}
                />
                <Input
                  placeholder="Optional: Pfad (z.B. Biologie/Zellbiologie)"
                  value={deckPath}
                  onChange={(event) => setDeckPath(event.target.value)}
                />
                <Button className="w-full" onClick={handleCreateDeck}>
                  <Plus size={16} /> Deck anlegen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setActiveTab('editor')}
          >
            <Plus size={16} /> Karte
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <nav aria-label="Deck-Tree" className="space-y-2 pr-2">
            {loading.decks ? (
              <p className="text-sm text-muted-foreground">Lade Decks...</p>
            ) : (
              deckTree.map((deck) => (
                <DeckTreeItem
                  key={deck.id}
                  node={deck}
                  level={0}
                  selectedId={selectedDeckId}
                  onSelect={setSelectedDeckId}
                />
              ))
            )}
          </nav>
        </ScrollArea>
      </aside>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-1 flex-col"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/60 px-6 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-semibold">
              Deck: {selectedDeck?.name ?? '–'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {stats.dueNow} fällig jetzt · {stats.dueToday} heute ·{' '}
              {stats.totalCards} Karten
            </p>
          </div>
          <TabsList className="bg-secondary/70">
            <TabsTrigger value="review">
              <BookOpen size={16} className="mr-2" /> Review
            </TabsTrigger>
            <TabsTrigger value="browse">
              <LayoutGrid size={16} className="mr-2" /> Browse
            </TabsTrigger>
            <TabsTrigger value="editor">
              <FileText size={16} className="mr-2" /> Editor
            </TabsTrigger>
            <TabsTrigger value="import">
              <Import size={16} className="mr-2" /> Import
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Star size={16} className="mr-2" /> Stats
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings size={16} className="mr-2" /> Settings
            </TabsTrigger>
          </TabsList>
        </header>

        <div className="flex-1 overflow-auto">
          <TabsContent value="review" className="h-full">
            <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <CardShell className="flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Nächste Karte
                    </span>
                    <Badge variant="secondary">
                      {dueCard ? 'Due jetzt' : 'Keine fälligen Karten'}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      'min-h-[180px] rounded-lg border border-border bg-background/60 p-6 text-lg shadow-inner transition',
                      reviewFlipped ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {dueCard ? (
                      reviewFlipped ? dueCard.back : dueCard.front
                    ) : (
                      <p className="text-muted-foreground">
                        Für dieses Deck sind aktuell keine Karten fällig.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(dueCard?.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setReviewFlipped((prev) => !prev)}
                    disabled={!dueCard}
                  >
                    Karte umdrehen (Space)
                  </Button>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <Button
                        key={score}
                        variant="secondary"
                        onClick={() => handleReview(score)}
                        disabled={!dueCard}
                      >
                        {score}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Shortcuts: Space = Flip, 0-5 = Bewertung</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleSnooze}
                      disabled={!dueCard}
                    >
                      Skip (S) · +10 min
                    </button>
                  </div>
                </div>
              </CardShell>
              <CardShell className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Heute fällig
                  </h3>
                  <p className="text-3xl font-semibold">{stats.dueToday}</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Streak</span>
                    <span className="text-sm font-semibold">
                      {stats.streakDays} Tage
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Retention
                    </span>
                    <span className="text-sm font-semibold">
                      {formatPercent(stats.retention)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fortschritt
                    </span>
                    <span className="text-sm font-semibold">
                      {stats.deckProgress}%
                    </span>
                  </div>
                </div>
              </CardShell>
            </div>
          </TabsContent>

          <TabsContent value="browse" className="h-full">
            <div className="space-y-4 p-6">
              <CardShell className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Karten im Deck</h3>
                  <div className="flex flex-wrap gap-2">
                    <Input placeholder="Tag-Filter" className="w-40" />
                    <Input placeholder="Status" className="w-32" />
                    <Input placeholder="Fällig bis" className="w-32" />
                  </div>
                </div>
                <div className="space-y-3">
                  {loading.cards && (
                    <p className="text-sm text-muted-foreground">
                      Karten werden geladen...
                    </p>
                  )}
                  {!loading.cards && cards.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Noch keine Karten im Deck.
                    </p>
                  )}
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-lg border border-border bg-background/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{card.front}</p>
                          <p className="text-sm text-muted-foreground">
                            {card.back}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {new Date(card.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {card.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardShell>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="h-full">
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <CardShell className="space-y-4">
                <h3 className="text-lg font-semibold">Neue Karte</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Frage / Prompt"
                    value={cardFront}
                    onChange={(event) => setCardFront(event.target.value)}
                  />
                  <Textarea
                    placeholder="Antwort / Back"
                    value={cardBack}
                    onChange={(event) => setCardBack(event.target.value)}
                  />
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={cardTags}
                    onChange={(event) => setCardTags(event.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCard}>
                    <Sparkles size={16} /> Speichern
                  </Button>
                  <Button variant="outline">Als Cloze</Button>
                </div>
              </CardShell>
              <CardShell className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Qualitätsregeln
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Eine Karte = ein Fakt / Begriff / Schritt.</li>
                  <li>Aktive Erinnerung statt Wiedererkennen.</li>
                  <li>Kurze, präzise Antworten.</li>
                  <li>Listen aufteilen, Prozesse zerlegen.</li>
                  <li>Erst verstehen, dann speichern.</li>
                </ul>
              </CardShell>
            </div>
          </TabsContent>

          <TabsContent value="import" className="h-full">
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <CardShell className="space-y-4">
                <h3 className="text-lg font-semibold">Import</h3>
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
                  Dateien hier ablegen oder klicken, um PDF, Bild oder Text zu
                  importieren.
                </div>
                <Button disabled>
                  <Sparkles size={16} /> Karten generieren
                </Button>
                <p className="text-xs text-muted-foreground">
                  Import + KI-Generierung folgen im nächsten Schritt.
                </p>
              </CardShell>
              <CardShell className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Vorschau
                </h4>
                <div className="rounded-lg border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  Sobald Quellen importiert sind, erscheint hier die Preview.
                </div>
              </CardShell>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="h-full">
            <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
              <CardShell className="space-y-2">
                <p className="text-sm text-muted-foreground">Heute fällig</p>
                <p className="text-3xl font-semibold">{stats.dueToday}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.dueNow} davon bereits überfällig
                </p>
              </CardShell>
              <CardShell className="space-y-2">
                <p className="text-sm text-muted-foreground">Reviews heute</p>
                <p className="text-3xl font-semibold">{stats.reviewsToday}</p>
                <p className="text-xs text-muted-foreground">
                  Retention {formatPercent(stats.retention)}
                </p>
              </CardShell>
              <CardShell className="space-y-2">
                <p className="text-sm text-muted-foreground">Deck-Fortschritt</p>
                <p className="text-3xl font-semibold">{stats.deckProgress}%</p>
                <p className="text-xs text-muted-foreground">
                  {stats.reviewedCards}/{stats.totalCards} Karten stabil
                </p>
              </CardShell>
              <CardShell className="md:col-span-2 xl:col-span-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Reviews pro Tag
                </h4>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {[14, 22, 18, 26, 30, 20, 28].map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full rounded-md bg-primary/20"
                        style={{ height: `${value * 2}px` }}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-muted-foreground">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardShell>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="h-full">
            <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
              <CardShell className="space-y-4">
                <h3 className="text-lg font-semibold">OpenRouter</h3>
                <div className="space-y-3">
                  <Input placeholder="API Key (wird lokal gespeichert)" />
                  <Input placeholder="Modell (z.B. moonshotai/kimi-k2.5)" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Temperatur" />
                    <Input placeholder="Max Tokens" />
                  </div>
                </div>
                <Button variant="outline" disabled>
                  Speichern
                </Button>
              </CardShell>
              <CardShell className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Sicherheit
                </h4>
                <p className="text-sm text-muted-foreground">
                  API Keys werden lokal gespeichert. Keine Cloud-Speicherung
                  von Karten oder Quellen.
                </p>
              </CardShell>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
