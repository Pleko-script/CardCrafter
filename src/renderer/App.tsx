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

import type {
  Card,
  CardWithScheduling,
  Deck,
  DeckDeletePreview,
  NextReviewInfo,
  ReviewSession,
  Stats,
} from '../shared/types';
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

const ratingOptions = [
  { value: 0, label: '0', hint: 'Gar nicht' },
  { value: 1, label: '1', hint: 'Teilweise' },
  { value: 2, label: '2', hint: 'Schwer' },
  { value: 3, label: '3', hint: 'Leicht' },
];

const POOR_SCORE_MAX = 1;

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

function DeckContextMenu({
  deck,
  onMove,
  onDelete,
}: {
  deck: DeckNode;
  onMove: (deckId: string) => void;
  onDelete: (deckId: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="Deck-Optionen"
      >
        ⋮
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-border bg-background shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onMove(deck.id);
                setIsOpen(false);
              }}
            >
              📁 Deck verschieben...
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(deck.id);
                setIsOpen(false);
              }}
            >
              🗑️ Deck löschen...
            </button>
          </div>
        </>
      )}
    </div>
  );
}

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
  onMove,
  onDelete,
  draggingId,
  dropTargetId,
  dropTargetType,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  node: DeckNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  draggingId: string | null;
  dropTargetId: string | null;
  dropTargetType: 'root' | 'deck' | null;
  onDragStart: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(
            'flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted',
            selectedId === node.id && 'bg-secondary text-foreground',
            dropTargetType === 'deck' &&
              dropTargetId === node.id &&
              'ring-2 ring-primary/70',
            draggingId === node.id && 'opacity-60',
          )}
          style={{ paddingLeft: 12 + level * 14 }}
          onClick={() => onSelect(node.id)}
          aria-current={selectedId === node.id ? 'page' : undefined}
          draggable
          onDragStart={(event) => onDragStart(node.id, event)}
          onDragEnd={onDragEnd}
          onDragOver={(event) => onDragOver(node.id, event)}
          onDragLeave={(event) => onDragLeave(node.id, event)}
          onDrop={(event) => onDrop(node.id, event)}
          aria-grabbed={draggingId === node.id}
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
        <DeckContextMenu deck={node} onMove={onMove} onDelete={onDelete} />
      </div>
      {hasChildren && open && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <DeckTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onDelete={onDelete}
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              dropTargetType={dropTargetType}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
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
  const [hasFlippedCurrentCard, setHasFlippedCurrentCard] = React.useState(false);
  const [currentSession, setCurrentSession] = React.useState<ReviewSession | null>(null);
  const [poorCardIds, setPoorCardIds] = React.useState<string[]>([]);
  const [nextReviewInfo, setNextReviewInfo] = React.useState<NextReviewInfo | null>(null);
  const [sessionMode, setSessionMode] = React.useState<
    'regular' | 'poor-repetition' | 'practice' | 'completed'
  >('regular');
  const [practicePoolIds, setPracticePoolIds] = React.useState<string[]>([]);
  const [draggingDeckId, setDraggingDeckId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  const [dropTargetType, setDropTargetType] = React.useState<'root' | 'deck' | null>(null);
  const [moveDeckId, setMoveDeckId] = React.useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = React.useState<string | null>(null);
  const [deleteDeckId, setDeleteDeckId] = React.useState<string | null>(null);
  const [deletePreview, setDeletePreview] = React.useState<DeckDeletePreview | null>(null);
  const [deleteMode, setDeleteMode] = React.useState<'cascade' | 'reparent'>('cascade');
  const [deckName, setDeckName] = React.useState('');
  const [deckPath, setDeckPath] = React.useState('');
  const [cardFront, setCardFront] = React.useState('');
  const [cardBack, setCardBack] = React.useState('');
  const [cardTags, setCardTags] = React.useState('');
  const [editingCard, setEditingCard] = React.useState<Card | null>(null);
  const [editFront, setEditFront] = React.useState('');
  const [editBack, setEditBack] = React.useState('');
  const [editTags, setEditTags] = React.useState('');
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
      setHasFlippedCurrentCard(false);
      setLoading((prev) => ({ ...prev, due: false }));
    },
    [],
  );

  const loadStats = React.useCallback(async (deckId: string | null) => {
    const data = await window.cardcrafter.getStats(deckId);
    setStats(data);
  }, []);

  const startSession = React.useCallback(
    async (mode: 'regular' | 'practice' = 'regular') => {
      const session = await window.cardcrafter.startReviewSession(selectedDeckId);
      setCurrentSession(session);
      setPoorCardIds([]);
      setPracticePoolIds([]);
      setSessionMode(mode);
      setReviewFlipped(false);
      setHasFlippedCurrentCard(false);
    },
    [selectedDeckId],
  );

  const endSession = React.useCallback(async () => {
    if (!currentSession) return;
    await window.cardcrafter.endReviewSession(currentSession.id);
    setCurrentSession(null);
    setSessionMode('completed');
    setDueCard(null);
    setReviewFlipped(false);
    setHasFlippedCurrentCard(false);
  }, [currentSession]);

  const loadNextReviewInfo = React.useCallback(async () => {
    const info = await window.cardcrafter.getNextReviewInfo(selectedDeckId);
    setNextReviewInfo(info);
  }, [selectedDeckId]);

  const startPracticeSession = React.useCallback(async () => {
    if (!selectedDeckId) return;
    const pool = cards.map((card) => card.id);
    if (pool.length === 0) {
      setDueCard(null);
      setSessionMode('regular');
      return;
    }
    if (!currentSession) {
      await startSession('practice');
    } else {
      setSessionMode('practice');
      setReviewFlipped(false);
      setHasFlippedCurrentCard(false);
    }
    setPracticePoolIds(pool);
    const nextCard = await window.cardcrafter.getDueCardWithPriority(
      selectedDeckId,
      pool,
    );
    if (nextCard) {
      setDueCard(nextCard);
      setReviewFlipped(false);
      setHasFlippedCurrentCard(false);
    }
  }, [cards, currentSession, selectedDeckId, startSession]);

  const performMoveDeck = React.useCallback(
    async (deckId: string, newParentId: string | null) => {
      try {
        await window.cardcrafter.moveDeck({ deckId, newParentId });
        await loadDecks();
        setSelectedDeckId(deckId);
        return true;
      } catch (error) {
        alert(`Fehler beim Verschieben: ${(error as Error).message}`);
        return false;
      }
    },
    [loadDecks],
  );

  const resetDragState = React.useCallback(() => {
    setDraggingDeckId(null);
    setDropTargetId(null);
    setDropTargetType(null);
  }, []);

  const handleDeckDragStart = React.useCallback(
    (deckId: string, event: React.DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.setData('text/plain', deckId);
      event.dataTransfer.effectAllowed = 'move';
      setDraggingDeckId(deckId);
      setDropTargetId(null);
      setDropTargetType(null);
    },
    [],
  );

  const handleDeckDragEnd = React.useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const handleDeckDragOver = React.useCallback(
    (deckId: string, event: React.DragEvent<HTMLButtonElement>) => {
      if (!draggingDeckId || draggingDeckId === deckId) return;
      event.preventDefault();
      setDropTargetId(deckId);
      setDropTargetType('deck');
    },
    [draggingDeckId],
  );

  const handleDeckDragLeave = React.useCallback(
    (deckId: string, event: React.DragEvent<HTMLButtonElement>) => {
      if (dropTargetId !== deckId) return;
      const related = event.relatedTarget as Node | null;
      if (related && event.currentTarget.contains(related)) return;
      setDropTargetId(null);
      setDropTargetType(null);
    },
    [dropTargetId],
  );

  const handleDeckDrop = React.useCallback(
    async (targetId: string, event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const draggedId =
        draggingDeckId ?? event.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === targetId) {
        resetDragState();
        return;
      }
      await performMoveDeck(draggedId, targetId);
      resetDragState();
    },
    [draggingDeckId, performMoveDeck, resetDragState],
  );

  const handleRootDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!draggingDeckId) return;
      event.preventDefault();
      setDropTargetId(null);
      setDropTargetType('root');
    },
    [draggingDeckId],
  );

  const handleRootDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (dropTargetType !== 'root') return;
      const related = event.relatedTarget as Node | null;
      if (related && event.currentTarget.contains(related)) return;
      setDropTargetType(null);
    },
    [dropTargetType],
  );

  const handleRootDrop = React.useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const draggedId =
        draggingDeckId ?? event.dataTransfer.getData('text/plain');
      if (!draggedId) {
        resetDragState();
        return;
      }
      await performMoveDeck(draggedId, null);
      resetDragState();
    },
    [draggingDeckId, performMoveDeck, resetDragState],
  );

  const openEditCard = (card: Card) => {
    setEditingCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditTags(card.tags.join(', '));
  };

  const closeEditDialog = React.useCallback(() => {
    setEditingCard(null);
    setEditFront('');
    setEditBack('');
    setEditTags('');
  }, []);

  const handleUpdateCard = React.useCallback(async () => {
    if (!editingCard) return;
    const front = editFront.trim();
    const back = editBack.trim();
    if (!front || !back) return;

    const tags = editTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      await window.cardcrafter.updateCard({
        id: editingCard.id,
        front,
        back,
        tags,
      });

      if (selectedDeckId) {
        await loadCards(selectedDeckId);
      }

      if (dueCard && dueCard.id === editingCard.id) {
        setDueCard({
          ...dueCard,
          front,
          back,
          tags,
        });
      }

      closeEditDialog();
    } catch (error) {
      alert(`Fehler beim Speichern: ${(error as Error).message}`);
    }
  }, [
    editingCard,
    editFront,
    editBack,
    editTags,
    selectedDeckId,
    loadCards,
    dueCard,
    closeEditDialog,
  ]);

  React.useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  React.useEffect(() => {
    if (!selectedDeckId) return;
    setPracticePoolIds([]);
    loadCards(selectedDeckId);
    loadDueCard(selectedDeckId);
    loadStats(selectedDeckId);
  }, [selectedDeckId, loadCards, loadDueCard, loadStats]);

  // Session starten beim Wechsel zum Review-Tab
  React.useEffect(() => {
    if (
      activeTab === 'review' &&
      !currentSession &&
      selectedDeckId &&
      sessionMode !== 'completed'
    ) {
      startSession();
    }
  }, [activeTab, currentSession, selectedDeckId, sessionMode, startSession]);

  // Next Review Info laden
  React.useEffect(() => {
    if (selectedDeckId) {
      loadNextReviewInfo();
    }
  }, [selectedDeckId, loadNextReviewInfo]);

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
    async (score: number) => {
      if (!dueCard || !hasFlippedCurrentCard) return;

      const q = Math.max(0, Math.min(3, score));
      const isPoor = q <= POOR_SCORE_MAX;
      const nextPoorCardIds = isPoor
        ? poorCardIds.includes(dueCard.id)
          ? poorCardIds
          : [...poorCardIds, dueCard.id]
        : poorCardIds.filter((id) => id !== dueCard.id);
      setPoorCardIds(nextPoorCardIds);

      // Review durchführen
      await window.cardcrafter.reviewCard({
        cardId: dueCard.id,
        q,
        durationMs: null,
      });

      if (selectedDeckId) {
        if (sessionMode === 'practice') {
          const nextPool = isPoor
            ? practicePoolIds
            : practicePoolIds.filter((id) => id !== dueCard.id);
          setPracticePoolIds(nextPool);

          if (nextPool.length === 0) {
            await endSession();
            await loadNextReviewInfo();
          } else {
            const nextCard = await window.cardcrafter.getDueCardWithPriority(
              selectedDeckId,
              nextPool,
            );
            if (nextCard) {
              setDueCard(nextCard);
              setReviewFlipped(false);
              setHasFlippedCurrentCard(false);
            } else {
              await endSession();
              await loadNextReviewInfo();
            }
          }

          await loadStats(selectedDeckId);
          return;
        }

        const nextDueCard = await window.cardcrafter.getDueCard(selectedDeckId);

        if (nextDueCard) {
          setSessionMode('regular');
          setDueCard(nextDueCard);
          setReviewFlipped(false);
          setHasFlippedCurrentCard(false);
        } else if (nextPoorCardIds.length > 0) {
          setSessionMode('poor-repetition');
          const candidates =
            nextPoorCardIds.filter((id) => id !== dueCard.id).length > 0
              ? nextPoorCardIds.filter((id) => id !== dueCard.id)
              : nextPoorCardIds;
          const nextPoorCard = await window.cardcrafter.getDueCardWithPriority(
            selectedDeckId,
            candidates,
          );

          if (nextPoorCard) {
            setDueCard(nextPoorCard);
            setReviewFlipped(false);
            setHasFlippedCurrentCard(false);
          } else {
            await endSession();
            await loadNextReviewInfo();
          }
        } else {
          await endSession();
          await loadNextReviewInfo();
        }

        await loadStats(selectedDeckId);
      }
    },
    [
      dueCard,
      hasFlippedCurrentCard,
      selectedDeckId,
      poorCardIds,
      practicePoolIds,
      sessionMode,
      endSession,
      loadNextReviewInfo,
      loadStats,
    ],
  );

  const handleSnooze = React.useCallback(async () => {
    if (!dueCard) return;
    await window.cardcrafter.snoozeCard(dueCard.id, 10);
    if (selectedDeckId) {
      await loadDueCard(selectedDeckId);
      await loadStats(selectedDeckId);
    }
  }, [dueCard, selectedDeckId, loadDueCard, loadStats]);

  const handleEndSession = React.useCallback(async () => {
    await endSession();
    await loadNextReviewInfo();
  }, [endSession, loadNextReviewInfo]);

  const startNextSession = React.useCallback(async () => {
    if (!selectedDeckId) return;
    const nextDue = await window.cardcrafter.getDueCard(selectedDeckId);
    if (nextDue) {
      await startSession('regular');
      setDueCard(nextDue);
      setReviewFlipped(false);
      setHasFlippedCurrentCard(false);
      return;
    }
    await startPracticeSession();
  }, [selectedDeckId, startPracticeSession, startSession]);

  const handleMoveDeck = async () => {
    if (!moveDeckId) return;

    const ok = await performMoveDeck(moveDeckId, moveTargetId);
    if (ok) {
      setMoveDeckId(null);
      setMoveTargetId(null);
    }
  };

  const loadDeletePreview = async (deckId: string) => {
    try {
      const preview = await window.cardcrafter.getDeletePreview(deckId);
      setDeletePreview(preview);
    } catch (error) {
      alert(`Fehler beim Laden der Vorschau: ${(error as Error).message}`);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deleteDeckId) return;

    try {
      await window.cardcrafter.deleteDeck({
        deckId: deleteDeckId,
        mode: deleteMode,
      });
      await loadDecks();

      // Wenn gelöschtes Deck ausgewählt war, deselektieren
      if (selectedDeckId === deleteDeckId) {
        setSelectedDeckId(null);
      }

      setDeleteDeckId(null);
      setDeletePreview(null);
    } catch (error) {
      alert(`Fehler beim Löschen: ${(error as Error).message}`);
    }
  };

  // Preview laden wenn Delete-Dialog öffnet
  React.useEffect(() => {
    if (deleteDeckId) {
      loadDeletePreview(deleteDeckId);
    }
  }, [deleteDeckId]);

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
        setHasFlippedCurrentCard(true);
        return;
      }
      if (event.key >= '0' && event.key <= '3') {
        if (!hasFlippedCurrentCard) return;
        handleReview(Number(event.key));
      }
      if (event.key.toLowerCase() === 's') {
        handleSnooze();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleReview, handleSnooze, hasFlippedCurrentCard]);

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

        {/* Move Deck Dialog */}
        <Dialog
          open={moveDeckId !== null}
          onOpenChange={(open) => !open && setMoveDeckId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deck verschieben</DialogTitle>
              <DialogDescription>
                Wähle einen neuen Ordner für dieses Deck oder "Root" für die oberste
                Ebene.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={moveTargetId ?? ''}
                onChange={(e) => setMoveTargetId(e.target.value || null)}
              >
                <option value="">Root (Oberste Ebene)</option>
                {decks
                  .filter((d) => d.id !== moveDeckId)
                  .map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <Button onClick={handleMoveDeck}>Verschieben</Button>
                <Button variant="outline" onClick={() => setMoveDeckId(null)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Deck Dialog */}
        <Dialog
          open={deleteDeckId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDeckId(null);
              setDeletePreview(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deck löschen</DialogTitle>
              <DialogDescription>
                Bist du sicher, dass du "{deletePreview?.deckName}" löschen möchtest?
              </DialogDescription>
            </DialogHeader>
            {deletePreview && (
              <div className="space-y-4">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                    Auswirkungen:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                    <li>• {deletePreview.totalCardCount} Karten werden gelöscht</li>
                    {deletePreview.childDeckCount > 0 && (
                      <li>• {deletePreview.childDeckCount} Unter-Decks betroffen</li>
                    )}
                  </ul>
                </div>

                {deletePreview.childDeckCount > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Was soll mit den Unter-Decks passieren?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2">
                        <input
                          type="radio"
                          value="cascade"
                          checked={deleteMode === 'cascade'}
                          onChange={(e) =>
                            setDeleteMode(e.target.value as 'cascade' | 'reparent')
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm">
                          <strong>Alles löschen</strong>
                          <br />
                          <span className="text-muted-foreground">
                            Deck und alle Unter-Decks inkl. Karten löschen
                          </span>
                        </span>
                      </label>
                      <label className="flex items-start gap-2">
                        <input
                          type="radio"
                          value="reparent"
                          checked={deleteMode === 'reparent'}
                          onChange={(e) =>
                            setDeleteMode(e.target.value as 'cascade' | 'reparent')
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm">
                          <strong>Unter-Decks behalten</strong>
                          <br />
                          <span className="text-muted-foreground">
                            Nur dieses Deck löschen, Unter-Decks eine Ebene hochschieben
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleDeleteDeck}>
                    Deck löschen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDeckId(null);
                      setDeletePreview(null);
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Card Dialog */}
        <Dialog
          open={editingCard !== null}
          onOpenChange={(open) => !open && closeEditDialog()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Karte bearbeiten</DialogTitle>
              <DialogDescription>
                Aktualisiere Frage, Antwort und Tags.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Frage / Prompt"
                value={editFront}
                onChange={(event) => setEditFront(event.target.value)}
              />
              <Textarea
                placeholder="Antwort / Back"
                value={editBack}
                onChange={(event) => setEditBack(event.target.value)}
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={editTags}
                onChange={(event) => setEditTags(event.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleUpdateCard}>Speichern</Button>
                <Button variant="outline" onClick={closeEditDialog}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Separator />

        <ScrollArea className="flex-1">
          <nav aria-label="Deck-Tree" className="space-y-2 pr-2">
            {draggingDeckId && (
              <div
                className={cn(
                  'rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground transition',
                  dropTargetType === 'root' &&
                    'border-primary bg-primary/10 text-foreground',
                )}
                onDragOver={handleRootDragOver}
                onDragLeave={handleRootDragLeave}
                onDrop={handleRootDrop}
              >
                Root (Oberste Ebene)
              </div>
            )}
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
                      onMove={setMoveDeckId}
                      onDelete={setDeleteDeckId}
                      draggingId={draggingDeckId}
                      dropTargetId={dropTargetId}
                      dropTargetType={dropTargetType}
                      onDragStart={handleDeckDragStart}
                      onDragEnd={handleDeckDragEnd}
                      onDragOver={handleDeckDragOver}
                      onDragLeave={handleDeckDragLeave}
                      onDrop={handleDeckDrop}
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
              {/* Regular Card Review */}
              {dueCard && (
                <CardShell className="flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Naechste Karte
                        </span>
                        {sessionMode === 'poor-repetition' && (
                          <Badge variant="outline">Schwierige Karten</Badge>
                        )}
                        {sessionMode === 'practice' && (
                          <Badge variant="outline">Freie Session</Badge>
                        )}
                      </div>
                      <Badge variant="secondary">Due jetzt</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border bg-background/60 p-4 shadow-inner">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Frage
                        </p>
                        <div className="mt-2 whitespace-pre-wrap text-base text-foreground">
                          {dueCard.front}
                        </div>
                      </div>
                      <div
                        className={cn(
                          'rounded-lg border border-border bg-background/60 p-4 shadow-inner transition',
                          reviewFlipped
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Antwort
                        </p>
                        <div className="mt-2 whitespace-pre-wrap text-base">
                          {reviewFlipped
                            ? dueCard.back
                            : 'Antwort ist verborgen. Druecke Space.'}
                        </div>
                      </div>
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
                    variant={!hasFlippedCurrentCard ? 'default' : 'outline'}
                    className={!hasFlippedCurrentCard ? 'ring-2 ring-primary animate-pulse' : ''}
                    onClick={() => {
                      setReviewFlipped((prev) => !prev);
                      setHasFlippedCurrentCard(true);
                    }}
                    disabled={!dueCard}
                  >
                    {reviewFlipped
                      ? 'Antwort verbergen'
                      : 'Antwort anzeigen (Space)'}
                  </Button>
                  {!hasFlippedCurrentCard && dueCard && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
                      💡 Decke zuerst die Antwort auf, dann bewerte dein Wissen
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {ratingOptions.map((rating) => (
                      <div
                        key={rating.value}
                        className="flex flex-col items-center gap-1"
                      >
                        <Button
                          variant="secondary"
                          onClick={() => handleReview(rating.value)}
                          disabled={!dueCard || !hasFlippedCurrentCard}
                          className={
                            !hasFlippedCurrentCard
                              ? 'cursor-not-allowed opacity-50'
                              : ''
                          }
                        >
                          {rating.label}
                        </Button>
                        <span className="text-[11px] text-muted-foreground">
                          {rating.hint}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Shortcuts: Space = Antwort, 0-3 = Bewertung</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={handleSnooze}
                        disabled={!dueCard}
                      >
                        Skip (S) · +10 min
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={handleEndSession}
                        disabled={!currentSession}
                      >
                        Fertig fuer heute
                      </button>
                    </div>
                  </div>
                </div>
              </CardShell>
              )}

              {!dueCard && sessionMode === 'regular' && (
                <CardShell className="flex flex-col items-center justify-center gap-6 p-10 text-center">
                  <div className="text-4xl">📭</div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Keine faelligen Karten
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Du kannst trotzdem eine freie Lern-Session starten, um
                      Karten zu wiederholen.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      onClick={startPracticeSession}
                      disabled={!selectedDeckId || cards.length === 0}
                    >
                      Trotzdem lernen
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('browse')}>
                      Karten durchsuchen
                    </Button>
                  </div>
                  {cards.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      In diesem Deck sind noch keine Karten.
                    </p>
                  )}
                </CardShell>
              )}

              {/* Session Completed */}
              {sessionMode === 'completed' && !dueCard && (
                <CardShell className="flex flex-col items-center justify-center gap-6 p-12 text-center">
                  <div className="text-6xl">🎉</div>
                  <div>
                    <h3 className="text-2xl font-semibold">Sehr gut gemacht!</h3>
                    <p className="text-muted-foreground mt-2">
                      Du hast alle fälligen Karten für dieses Deck durchgearbeitet.
                    </p>
                  </div>
                  {nextReviewInfo?.nextDueAt && (
                    <div className="rounded-lg border border-border bg-secondary/30 p-4 min-w-[250px]">
                      <p className="text-sm text-muted-foreground">
                        Nächste Review-Session
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {nextReviewInfo.formattedTime}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {nextReviewInfo.nextDueCardCount} Karten werden fällig
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={startNextSession}
                    >
                      Neue Session starten
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('browse')}>
                      Karten durchsuchen
                    </Button>
                  </div>
                </CardShell>
              )}

              <CardShell className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Heute fällig
                  </h3>
                  <p className="text-3xl font-semibold">{stats.dueToday}</p>
                </div>
                {nextReviewInfo?.nextDueAt && stats.dueNow === 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Nächste Review-Session
                      </h3>
                      <p className="text-lg font-semibold mt-1">
                        {nextReviewInfo.formattedTime}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {nextReviewInfo.nextDueCardCount} Karten
                      </p>
                    </div>
                  </>
                )}
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
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCard(card)}
                          >
                            Bearbeiten
                          </Button>
                        </div>
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
