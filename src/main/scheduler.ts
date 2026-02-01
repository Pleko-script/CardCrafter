import type { Scheduling } from '../shared/types';

const DAY_MS = 24 * 60 * 60 * 1000;

type ScheduleInput = {
  current: Scheduling;
  q: number;
  now: number;
};

export function computeNextSchedule({ current, q, now }: ScheduleInput): Scheduling {
  const qClamped = Math.max(0, Math.min(3, q));
  const prevInterval = current.intervalDays;

  // Map 0-3 to SM-2-like quality (0, 2, 4, 5) for a smoother ease update.
  const sm2Quality = [0, 2, 4, 5][qClamped];
  let ef =
    current.ef +
    (0.1 - (5 - sm2Quality) * (0.08 + (5 - sm2Quality) * 0.02));
  if (ef < 1.3) {
    ef = 1.3;
  }

  let n = current.n;
  let intervalDays = prevInterval;
  let dueAt = current.dueAt;

  if (qClamped <= 1) {
    // Fail/partial: reset to a short learning step.
    n = 0;
    intervalDays = 0;
    const minutes = qClamped === 0 ? 10 : 30;
    dueAt = now + minutes * 60 * 1000;
  } else {
    // Success: grow intervals, with a smaller jump for "hard".
    n = n + 1;
    if (n === 1) {
      intervalDays = 1;
    } else if (n === 2) {
      intervalDays = 3;
    } else {
      const multiplier = qClamped === 2 ? 0.85 : 1;
      intervalDays = Math.max(1, Math.ceil(prevInterval * ef * multiplier));
    }
    dueAt = now + intervalDays * DAY_MS;
  }

  return {
    ...current,
    n,
    intervalDays,
    ef,
    dueAt,
    lastReviewedAt: now,
  };
}

export function snoozeSchedule(
  current: Scheduling,
  minutes: number,
  now: number,
): Scheduling {
  const minutesSafe = Number.isFinite(minutes) ? minutes : 10;
  const delayMs = Math.max(1, minutesSafe) * 60 * 1000;
  return {
    ...current,
    dueAt: now + delayMs,
  };
}
