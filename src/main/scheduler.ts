import type { Scheduling } from '../shared/types';

const DAY_MS = 24 * 60 * 60 * 1000;

type ScheduleInput = {
  current: Scheduling;
  q: number;
  now: number;
};

export function computeNextSchedule({ current, q, now }: ScheduleInput): Scheduling {
  const qClamped = Math.max(0, Math.min(5, q));
  const prevInterval = current.intervalDays;
  let ef =
    current.ef +
    (0.1 - (5 - qClamped) * (0.08 + (5 - qClamped) * 0.02));
  if (ef < 1.3) {
    ef = 1.3;
  }

  let n = current.n;
  let intervalDays = prevInterval;

  if (qClamped < 3) {
    n = 1;
    intervalDays = 1;
  } else {
    n = n + 1;
    if (n === 1) {
      intervalDays = 1;
    } else if (n === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.ceil(prevInterval * ef);
    }
  }

  return {
    ...current,
    n,
    intervalDays,
    ef,
    dueAt: now + intervalDays * DAY_MS,
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
