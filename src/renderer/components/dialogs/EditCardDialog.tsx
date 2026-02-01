import React from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type EditCardDialogProps = {
  open: boolean;
  front: string;
  back: string;
  tags: string;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function EditCardDialog({
  open,
  front,
  back,
  tags,
  onFrontChange,
  onBackChange,
  onTagsChange,
  onSave,
  onClose,
}: EditCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Karte bearbeiten</DialogTitle>
          <DialogDescription>
            Aktualisiere Frage, Antwort und Tags.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Frage / Vorderseite"
            value={front}
            onChange={(event) => onFrontChange(event.target.value)}
          />
          <Textarea
            placeholder="Antwort / Rückseite"
            value={back}
            onChange={(event) => onBackChange(event.target.value)}
          />
          <Input
            placeholder="Tags (kommagetrennt)"
            value={tags}
            onChange={(event) => onTagsChange(event.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={onSave}>Speichern</Button>
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
