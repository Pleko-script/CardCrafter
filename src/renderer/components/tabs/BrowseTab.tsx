import React from 'react';
import DOMPurify from 'dompurify';

import type { Card } from '../../../shared/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card as CardShell } from '../ui/card';
import { Input } from '../ui/input';
import { TabsContent } from '../ui/tabs';

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function CardPreview({ html, className }: { html: string; className?: string }) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'img'],
    ALLOWED_ATTR: ['src', 'alt', 'class'],
  });

  // For preview, show text only (no images) and truncate
  const textOnly = stripHtml(html);
  const truncated = textOnly.length > 100 ? textOnly.slice(0, 100) + '...' : textOnly;

  // Check if there are images in the content
  const hasImages = html.includes('<img');

  return (
    <span className={className}>
      {truncated}
      {hasImages && <span className="text-muted-foreground ml-1">[Bild]</span>}
    </span>
  );
}

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
              <Input placeholder="Fällig bis" className="w-32" />
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
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      <CardPreview html={card.front} />
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <CardPreview html={card.back} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
