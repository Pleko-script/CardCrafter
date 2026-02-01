import React from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '../ui/button';
import { Card as CardShell } from '../ui/card';
import { TabsContent } from '../ui/tabs';

export function ImportTab() {
  return (
    <TabsContent value="import" className="h-full">
      <div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <CardShell className="space-y-4">
          <h3 className="text-lg font-semibold">Import</h3>
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
            Dateien hier ablegen oder klicken, um PDF, Bild oder Text zu importieren.
          </div>
          <Button disabled>
            <Sparkles size={16} /> Karten generieren
          </Button>
          <p className="text-xs text-muted-foreground">
            Import + KI-Generierung folgen im naechsten Schritt.
          </p>
        </CardShell>
        <CardShell className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Vorschau</h4>
          <div className="rounded-lg border border-border bg-background/70 p-4 text-sm text-muted-foreground">
            Sobald Quellen importiert sind, erscheint hier die Preview.
          </div>
        </CardShell>
      </div>
    </TabsContent>
  );
}
