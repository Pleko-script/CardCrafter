import React from 'react';

import type { Stats } from '../../../shared/types';
import { Card as CardShell } from '../ui/card';
import { TabsContent } from '../ui/tabs';

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

type StatsTabProps = {
  stats: Stats;
};

export function StatsTab({ stats }: StatsTabProps) {
  return (
    <TabsContent value="stats" className="h-full">
      <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
        <CardShell className="space-y-2">
          <p className="text-sm text-muted-foreground">Heute faellig</p>
          <p className="text-3xl font-semibold">{stats.dueToday}</p>
          <p className="text-xs text-muted-foreground">
            {stats.dueNow} davon bereits ueberfaellig
          </p>
        </CardShell>
        <CardShell className="space-y-2">
          <p className="text-sm text-muted-foreground">Reviews heute</p>
          <p className="text-3xl font-semibold">{stats.reviewsToday}</p>
          <p className="text-xs text-muted-foreground">
            Retention {formatPercent(stats.retention)}
          </p>
        </CardShell>
        <CardShell className="space-y-2">
          <p className="text-sm text-muted-foreground">Deck-Fortschritt</p>
          <p className="text-3xl font-semibold">{stats.deckProgress}%</p>
          <p className="text-xs text-muted-foreground">
            {stats.reviewedCards}/{stats.totalCards} Karten stabil
          </p>
        </CardShell>
        <CardShell className="md:col-span-2 xl:col-span-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Reviews pro Tag</h4>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {[14, 22, 18, 26, 30, 20, 28].map((value, index) => (
              <div key={`${value}-${index}`} className="flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-md bg-primary/20"
                  style={{ height: `${value * 2}px` }}
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}
                </span>
              </div>
            ))}
          </div>
        </CardShell>
      </div>
    </TabsContent>
  );
}
