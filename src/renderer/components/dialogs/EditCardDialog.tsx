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
import { RichEditor } from '../ui/rich-editor';

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Karte bearbeiten</DialogTitle>
          <DialogDescription>
            Aktualisiere Frage, Antwort und Tags. Bilder per Drag & Drop oder Strg+V einfügen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Frage / Vorderseite
            </label>
            <RichEditor
              value={front}
              onChange={onFrontChange}
              placeholder="Frage eingeben..."
              minHeight="80px"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Antwort / Rückseite
            </label>
            <RichEditor
              value={back}
              onChange={onBackChange}
              placeholder="Antwort eingeben..."
              minHeight="100px"
            />
          </div>
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
