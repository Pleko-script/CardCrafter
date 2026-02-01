import React from 'react';

import type { CardWithScheduling, NextReviewInfo, Stats } from '../../../shared/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card as CardShell } from '../ui/card';
import { Separator } from '../ui/separator';
import { TabsContent } from '../ui/tabs';
import { cn } from '../../lib/utils';

const ratingOptions = [
  { value: 0, label: '0', hint: 'Gar nicht' },
  { value: 1, label: '1', hint: 'Teilweise' },
  { value: 2, label: '2', hint: 'Schwer' },
  { value: 3, label: '3', hint: 'Leicht' },
];

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

type ReviewTabProps = {
  dueCard: CardWithScheduling | null;
  stats: Stats;
  reviewFlipped: boolean;
  hasFlippedCurrentCard: boolean;
  sessionMode: 'regular' | 'poor-repetition' | 'practice' | 'completed';
  nextReviewInfo: NextReviewInfo | null;
  cardsCount: number;
  currentSessionActive: boolean;
  onFlip: () => void;
  onReview: (score: number) => void;
  onSnooze: () => void;
  onEndSession: () => void;
  onStartPractice: () => void;
  onStartNextSession: () => void;
  onBrowse: () => void;
};

export function ReviewTab({
  dueCard,
  stats,
  reviewFlipped,
  hasFlippedCurrentCard,
  sessionMode,
  nextReviewInfo,
  cardsCount,
  currentSessionActive,
  onFlip,
  onReview,
  onSnooze,
  onEndSession,
  onStartPractice,
  onStartNextSession,
  onBrowse,
}: ReviewTabProps) {
  return (
    <TabsContent value="review" className="h-full">
      <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        {dueCard && (
          <CardShell className="flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Naechste Karte
                  </span>
                  {sessionMode === 'poor-repetition' && (
                    <Badge variant="outline">Schwierige Karten</Badge>
                  )}
                  {sessionMode === 'practice' && (
                    <Badge variant="outline">Freie Session</Badge>
                  )}
                </div>
                <Badge variant="secondary">Due jetzt</Badge>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-background/60 p-4 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Frage
                  </p>
                  <div className="mt-2 whitespace-pre-wrap text-base text-foreground">
                    {dueCard.front}
                  </div>
                </div>
                <div
                  className={cn(
                    'rounded-lg border border-border bg-background/60 p-4 shadow-inner transition',
                    reviewFlipped ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Antwort
                  </p>
                  <div className="mt-2 whitespace-pre-wrap text-base">
                    {reviewFlipped
                      ? dueCard.back
                      : 'Antwort ist verborgen. Druecke Space.'}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(dueCard?.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Button
                variant={!hasFlippedCurrentCard ? 'default' : 'outline'}
                className={!hasFlippedCurrentCard ? 'ring-2 ring-primary animate-pulse' : ''}
                onClick={onFlip}
                disabled={!dueCard}
              >
                {reviewFlipped ? 'Antwort verbergen' : 'Antwort anzeigen (Space)'}
              </Button>
              {!hasFlippedCurrentCard && dueCard && (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
                  Hinweis: Decke zuerst die Antwort auf, dann bewerte dein Wissen
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {ratingOptions.map((rating) => (
                  <div key={rating.value} className="flex flex-col items-center gap-1">
                    <Button
                      variant="secondary"
                      onClick={() => onReview(rating.value)}
                      disabled={!dueCard || !hasFlippedCurrentCard}
                      className={!hasFlippedCurrentCard ? 'cursor-not-allowed opacity-50' : ''}
                    >
                      {rating.label}
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      {rating.hint}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Shortcuts: Space = Antwort, 0-3 = Bewertung</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={onSnooze}
                    disabled={!dueCard}
                  >
                    Skip (S) - +10 min
                  </button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={onEndSession}
                    disabled={!currentSessionActive}
                  >
                    Fertig fuer heute
                  </button>
                </div>
              </div>
            </div>
          </CardShell>
        )}

        {!dueCard && sessionMode === 'regular' && (
          <CardShell className="flex flex-col items-center justify-center gap-6 p-10 text-center">
            <div className="text-4xl">---</div>
            <div>
              <h3 className="text-xl font-semibold">Keine faelligen Karten</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Du kannst trotzdem eine freie Lern-Session starten, um Karten zu
                wiederholen.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onStartPractice} disabled={cardsCount === 0}>
                Trotzdem lernen
              </Button>
              <Button variant="outline" onClick={onBrowse}>
                Karten durchsuchen
              </Button>
            </div>
            {cardsCount === 0 && (
              <p className="text-xs text-muted-foreground">
                In diesem Deck sind noch keine Karten.
              </p>
            )}
          </CardShell>
        )}

        {sessionMode === 'completed' && !dueCard && (
          <CardShell className="flex flex-col items-center justify-center gap-6 p-12 text-center">
            <div className="text-6xl">OK</div>
            <div>
              <h3 className="text-2xl font-semibold">Sehr gut gemacht!</h3>
              <p className="text-muted-foreground mt-2">
                Du hast alle faelligen Karten fuer dieses Deck durchgearbeitet.
              </p>
            </div>
            {nextReviewInfo?.nextDueAt && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 min-w-[250px]">
                <p className="text-sm text-muted-foreground">Naechste Review-Session</p>
                <p className="text-lg font-semibold mt-1">{nextReviewInfo.formattedTime}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextReviewInfo.nextDueCardCount} Karten werden faellig
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={onStartNextSession}>Neue Session starten</Button>
              <Button variant="outline" onClick={onBrowse}>
                Karten durchsuchen
              </Button>
            </div>
          </CardShell>
        )}

        <CardShell className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Heute faellig</h3>
            <p className="text-3xl font-semibold">{stats.dueToday}</p>
          </div>
          {nextReviewInfo?.nextDueAt && stats.dueNow === 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Naechste Review-Session
                </h3>
                <p className="text-lg font-semibold mt-1">{nextReviewInfo.formattedTime}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextReviewInfo.nextDueCardCount} Karten
                </p>
              </div>
            </>
          )}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Streak</span>
              <span className="text-sm font-semibold">{stats.streakDays} Tage</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Retention</span>
              <span className="text-sm font-semibold">{formatPercent(stats.retention)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fortschritt</span>
              <span className="text-sm font-semibold">{stats.deckProgress}%</span>
            </div>
          </div>
        </CardShell>
      </div>
    </TabsContent>
  );
}
