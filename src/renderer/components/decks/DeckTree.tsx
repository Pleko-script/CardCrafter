import React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { ChevronDown, FolderTree } from 'lucide-react';

import type { Deck } from '../../../shared/types';
import { cn } from '../../lib/utils';

type DeckNode = Deck & { children: DeckNode[] };

type DeckTreeProps = {
  decks: Deck[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  onMoveDeck: (deckId: string, newParentId: string | null) => Promise<boolean>;
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
        ...
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
              Deck verschieben...
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
              Deck loeschen...
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

function isDescendant(
  deckMap: Map<string, DeckNode>,
  parentId: string,
  childId: string,
): boolean {
  const parent = deckMap.get(parentId);
  if (!parent) return false;
  for (const child of parent.children) {
    if (child.id === childId || isDescendant(deckMap, child.id, childId)) {
      return true;
    }
  }
  return false;
}

function DraggableDeckItem({
  node,
  level,
  selectedId,
  onSelect,
  onMove,
  onDelete,
  activeDragId,
  overDropId,
}: {
  node: DeckNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  activeDragId: string | null;
  overDropId: string | null;
}) {
  const [open, setOpen] = React.useState(true);
  const hasChildren = node.children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { node },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { node },
  });

  const combinedRef = (element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  const isDropTarget = overDropId === `drop-${node.id}`;

  return (
    <div>
      <div
        ref={combinedRef}
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted cursor-grab',
          selectedId === node.id && 'bg-secondary text-foreground',
          isDropTarget && 'ring-2 ring-primary/70 bg-primary/10',
          isDragging && 'opacity-50 cursor-grabbing',
          activeDragId && activeDragId !== node.id && 'cursor-pointer',
        )}
        style={{ paddingLeft: 12 + level * 14 }}
        onClick={() => !isDragging && onSelect(node.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(node.id);
          }
        }}
        {...attributes}
        {...listeners}
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
            onPointerDown={(e) => e.stopPropagation()}
          >
            {open ? '-' : '+'}
          </button>
        )}
        <div onPointerDown={(e) => e.stopPropagation()}>
          <DeckContextMenu deck={node} onMove={onMove} onDelete={onDelete} />
        </div>
      </div>
      {hasChildren && open && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <DraggableDeckItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onDelete={onDelete}
              activeDragId={activeDragId}
              overDropId={overDropId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RootDropZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: 'drop-root',
    data: { isRoot: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground transition',
        isOver && 'border-primary bg-primary/10 text-foreground',
      )}
    >
      Root (Oberste Ebene)
    </div>
  );
}

function DragOverlayContent({ node }: { node: DeckNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-background border border-border shadow-lg px-3 py-2 text-sm">
      <FolderTree size={16} className="text-muted-foreground" />
      <span>{node.name}</span>
    </div>
  );
}

export function DeckTree({
  decks,
  loading,
  selectedId,
  onSelect,
  onMove,
  onDelete,
  onMoveDeck,
}: DeckTreeProps) {
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);
  const [overDropId, setOverDropId] = React.useState<string | null>(null);

  const deckTree = React.useMemo(() => buildDeckTree(decks), [decks]);
  const deckMap = React.useMemo(() => {
    const map = new Map<string, DeckNode>();
    const addToMap = (nodes: DeckNode[]) => {
      for (const node of nodes) {
        map.set(node.id, node);
        addToMap(node.children);
      }
    };
    addToMap(deckTree);
    return map;
  }, [deckTree]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const activeDragNode = activeDragId ? deckMap.get(activeDragId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverDropId(event.over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverDropId(null);

    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    // Dropping on root
    if (overId === 'drop-root') {
      const draggedDeck = deckMap.get(draggedId);
      if (draggedDeck && draggedDeck.parentId !== null) {
        await onMoveDeck(draggedId, null);
      }
      return;
    }

    // Dropping on another deck
    if (overId.startsWith('drop-')) {
      const targetId = overId.replace('drop-', '');

      // Don't drop on itself
      if (draggedId === targetId) return;

      // Don't drop on own descendant
      if (isDescendant(deckMap, draggedId, targetId)) return;

      // Don't move if already a child of target
      const draggedDeck = deckMap.get(draggedId);
      if (draggedDeck && draggedDeck.parentId === targetId) return;

      await onMoveDeck(draggedId, targetId);
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setOverDropId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <nav aria-label="Deck-Tree" className="space-y-2 pr-2">
        {activeDragId && (
          <RootDropZone isOver={overDropId === 'drop-root'} />
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Lade Decks...</p>
        ) : (
          deckTree.map((deck) => (
            <DraggableDeckItem
              key={deck.id}
              node={deck}
              level={0}
              selectedId={selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onDelete={onDelete}
              activeDragId={activeDragId}
              overDropId={overDropId}
            />
          ))
        )}
      </nav>
      <DragOverlay>
        {activeDragNode ? <DragOverlayContent node={activeDragNode} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
