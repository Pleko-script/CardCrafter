import React from 'react';

import type { Deck } from '../../../shared/types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type MoveDeckDialogProps = {
  open: boolean;
  decks: Deck[];
  moveDeckId: string | null;
  targetId: string | null;
  onTargetChange: (value: string | null) => void;
  onMove: () => void;
  onClose: () => void;
};

export function MoveDeckDialog({
  open,
  decks,
  moveDeckId,
  targetId,
  onTargetChange,
  onMove,
  onClose,
}: MoveDeckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deck verschieben</DialogTitle>
          <DialogDescription>
            Waehle einen neuen Ordner fuer dieses Deck oder "Root" fuer die oberste
            Ebene.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={targetId ?? ''}
            onChange={(e) => onTargetChange(e.target.value || null)}
          >
            <option value="">Root (Oberste Ebene)</option>
            {decks
              .filter((deck) => deck.id !== moveDeckId)
              .map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={onMove}>Verschieben</Button>
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
