import React from 'react';

import type { DeckDeletePreview } from '../../../shared/types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type DeleteDeckDialogProps = {
  open: boolean;
  preview: DeckDeletePreview | null;
  mode: 'cascade' | 'reparent';
  onModeChange: (mode: 'cascade' | 'reparent') => void;
  onDelete: () => void;
  onClose: () => void;
};

export function DeleteDeckDialog({
  open,
  preview,
  mode,
  onModeChange,
  onDelete,
  onClose,
}: DeleteDeckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deck löschen</DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du "{preview?.deckName}" löschen möchtest?
          </DialogDescription>
        </DialogHeader>
        {preview && (
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                Auswirkungen:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                <li>- {preview.totalCardCount} Karten werden gelöscht</li>
                {preview.childDeckCount > 0 && (
                  <li>- {preview.childDeckCount} Unter-Decks betroffen</li>
                )}
              </ul>
            </div>

            {preview.childDeckCount > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Was soll mit den Unter-Decks passieren?
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2">
                    <input
                      type="radio"
                      value="cascade"
                      checked={mode === 'cascade'}
                      onChange={(e) => onModeChange(e.target.value as 'cascade' | 'reparent')}
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
                      checked={mode === 'reparent'}
                      onChange={(e) => onModeChange(e.target.value as 'cascade' | 'reparent')}
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
              <Button variant="destructive" onClick={onDelete}>
                Deck löschen
              </Button>
              <Button variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
