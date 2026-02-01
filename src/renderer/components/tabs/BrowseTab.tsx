import React from 'react';

import type { Card } from '../../../shared/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card as CardShell } from '../ui/card';
import { Input } from '../ui/input';
import { TabsContent } from '../ui/tabs';

type BrowseTabProps = {
  cards: Card[];
  loading: boolean;
  onEditCard: (card: Card) => void;
};

export function BrowseTab({ cards, loading, onEditCard }: BrowseTabProps) {
  return (
    <TabsContent value="browse" className="h-full">
      <div className="space-y-4 p-6">
        <CardShell className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Karten im Deck</h3>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Tag-Filter" className="w-40" />
              <Input placeholder="Status" className="w-32" />
              <Input placeholder="Faellig bis" className="w-32" />
            </div>
          </div>
          <div className="space-y-3">
            {loading && (
              <p className="text-sm text-muted-foreground">
                Karten werden geladen...
              </p>
            )}
            {!loading && cards.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Karten im Deck.
              </p>
            )}
            {cards.map((card) => (
              <div
                key={card.id}
                className="rounded-lg border border-border bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{card.front}</p>
                    <p className="text-sm text-muted-foreground">{card.back}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => onEditCard(card)}>
                      Bearbeiten
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      </div>
    </TabsContent>
  );
}
