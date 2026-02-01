import React from 'react';

import { Button } from '../ui/button';
import { Card as CardShell } from '../ui/card';
import { Input } from '../ui/input';
import { TabsContent } from '../ui/tabs';

export function SettingsTab() {
  return (
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
          <h4 className="text-sm font-semibold text-muted-foreground">Sicherheit</h4>
          <p className="text-sm text-muted-foreground">
            API Keys werden lokal gespeichert. Keine Cloud-Speicherung von Karten
            oder Quellen.
          </p>
        </CardShell>
      </div>
    </TabsContent>
  );
}
