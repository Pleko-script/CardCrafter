import React from 'react';
import { BookOpen, FileText, Import, LayoutGrid, Plus, Settings, Star } from 'lucide-react';

import type {
  Card,
  CardWithScheduling,
  Deck,
  DeckDeletePreview,
  NextReviewInfo,
  ReviewSession,
  Stats,
} from '../shared/types';
import { DeckTree } from './components/decks/DeckTree';
import { DeleteDeckDialog } from './components/dialogs/DeleteDeckDialog';
import { EditCardDialog } from './components/dialogs/EditCardDialog';
import { MoveDeckDialog } from './components/dialogs/MoveDeckDialog';
import { BrowseTab } from './components/tabs/BrowseTab';
import { EditorTab } from './components/tabs/EditorTab';
import { ImportTab } from './components/tabs/ImportTab';
import { ReviewTab } from './components/tabs/ReviewTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { StatsTab } from './components/tabs/StatsTab';
import { Button } from './components/ui/button';
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
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';

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
  const [sessionMode, setSessionMode] = React.useState<'regular' | 'poor-repetition' | 'practice' | 'completed'>('regular');
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

        <MoveDeckDialog
          open={moveDeckId !== null}
          decks={decks}
          moveDeckId={moveDeckId}
          targetId={moveTargetId}
          onTargetChange={setMoveTargetId}
          onMove={handleMoveDeck}
          onClose={() => {
            setMoveDeckId(null);
            setMoveTargetId(null);
          }}
        />

        <DeleteDeckDialog
          open={deleteDeckId !== null}
          preview={deletePreview}
          mode={deleteMode}
          onModeChange={setDeleteMode}
          onDelete={handleDeleteDeck}
          onClose={() => {
            setDeleteDeckId(null);
            setDeletePreview(null);
          }}
        />

        <EditCardDialog
          open={editingCard !== null}
          front={editFront}
          back={editBack}
          tags={editTags}
          onFrontChange={setEditFront}
          onBackChange={setEditBack}
          onTagsChange={setEditTags}
          onSave={handleUpdateCard}
          onClose={closeEditDialog}
        />

        <Separator />

        <ScrollArea className="flex-1">
          <DeckTree
            decks={decks}
            loading={loading.decks}
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
            onRootDragOver={handleRootDragOver}
            onRootDragLeave={handleRootDragLeave}
            onRootDrop={handleRootDrop}
          />
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
          <ReviewTab
            dueCard={dueCard}
            stats={stats}
            reviewFlipped={reviewFlipped}
            hasFlippedCurrentCard={hasFlippedCurrentCard}
            sessionMode={sessionMode}
            nextReviewInfo={nextReviewInfo}
            cardsCount={cards.length}
            currentSessionActive={currentSession !== null}
            onFlip={() => {
              setReviewFlipped((prev) => !prev);
              setHasFlippedCurrentCard(true);
            }}
            onReview={handleReview}
            onSnooze={handleSnooze}
            onEndSession={handleEndSession}
            onStartPractice={startPracticeSession}
            onStartNextSession={startNextSession}
            onBrowse={() => setActiveTab('browse')}
          />

          <BrowseTab
            cards={cards}
            loading={loading.cards}
            onEditCard={openEditCard}
          />

          <EditorTab
            front={cardFront}
            back={cardBack}
            tags={cardTags}
            onFrontChange={setCardFront}
            onBackChange={setCardBack}
            onTagsChange={setCardTags}
            onSave={handleCreateCard}
          />

          <ImportTab />

          <StatsTab stats={stats} />

          <SettingsTab />
        </div>
      </Tabs>
    </div>
  );
}
