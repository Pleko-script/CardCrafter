import React from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '../ui/button';
import { Card as CardShell } from '../ui/card';
import { Input } from '../ui/input';
import { TabsContent } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

type EditorTabProps = {
  front: string;
  back: string;
  tags: string;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onSave: () => void;
};

export function EditorTab({
  front,
  back,
  tags,
  onFrontChange,
  onBackChange,
  onTagsChange,
  onSave,
}: EditorTabProps) {
  return (
    <TabsContent value="editor" className="h-full">
      <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <CardShell className="space-y-4">
          <h3 className="text-lg font-semibold">Neue Karte</h3>
          <div className="space-y-3">
            <Input
              placeholder="Frage / Prompt"
              value={front}
              onChange={(event) => onFrontChange(event.target.value)}
            />
            <Textarea
              placeholder="Antwort / Back"
              value={back}
              onChange={(event) => onBackChange(event.target.value)}
            />
            <Input
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(event) => onTagsChange(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSave}>
              <Sparkles size={16} /> Speichern
            </Button>
            <Button variant="outline">Als Cloze</Button>
          </div>
        </CardShell>
        <CardShell className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Qualitaetsregeln</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Eine Karte = ein Fakt / Begriff / Schritt.</li>
            <li>Aktive Erinnerung statt Wiedererkennen.</li>
            <li>Kurze, praezise Antworten.</li>
            <li>Listen aufteilen, Prozesse zerlegen.</li>
            <li>Erst verstehen, dann speichern.</li>
          </ul>
        </CardShell>
      </div>
    </TabsContent>
  );
}
