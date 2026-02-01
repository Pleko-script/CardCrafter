import React from 'react';
import { ChevronDown, FolderTree } from 'lucide-react';

import type { Deck } from '../../../shared/types';
import { cn } from '../../lib/utils';

export type DeckDragTarget = 'root' | 'deck' | null;

type DeckNode = Deck & { children: DeckNode[] };

type DeckTreeProps = {
  decks: Deck[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  draggingId: string | null;
  dropTargetId: string | null;
  dropTargetType: DeckDragTarget;
  onDragStart: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (deckId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onRootDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onRootDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onRootDrop: (event: React.DragEvent<HTMLDivElement>) => void;
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
  dropTargetType: DeckDragTarget;
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
              {open ? '-' : '+'}
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

export function DeckTree({
  decks,
  loading,
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
  onRootDragOver,
  onRootDragLeave,
  onRootDrop,
}: DeckTreeProps) {
  const deckTree = React.useMemo(() => buildDeckTree(decks), [decks]);

  return (
    <nav aria-label="Deck-Tree" className="space-y-2 pr-2">
      {draggingId && (
        <div
          className={cn(
            'rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground transition',
            dropTargetType === 'root' &&
              'border-primary bg-primary/10 text-foreground',
          )}
          onDragOver={onRootDragOver}
          onDragLeave={onRootDragLeave}
          onDrop={onRootDrop}
        >
          Root (Oberste Ebene)
        </div>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Lade Decks...</p>
      ) : (
        deckTree.map((deck) => (
          <DeckTreeItem
            key={deck.id}
            node={deck}
            level={0}
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
        ))
      )}
    </nav>
  );
}
