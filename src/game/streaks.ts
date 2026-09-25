import { addDays, dayDiff } from '../lib/dates'

/**
 * Consecutive days in `days` ending exactly at `end` (inclusive).
 * Returns 0 if `end` itself is not in the set.
 */
export function runEndingAt(days: ReadonlySet<string>, end: string): number {
  let n = 0
  let cursor = end
  while (days.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/**
 * The live streak as of `today`. A streak stays alive through today even if
 * today isn't done yet — it only breaks once a full day is missed.
 */
export function currentStreak(days: ReadonlySet<string>, today: string): number {
  return days.has(today) ? runEndingAt(days, today) : runEndingAt(days, addDays(today, -1))
}

/** Streak the user had going into `day` (used to compute the XP bonus). */
export function streakBefore(days: ReadonlySet<string>, day: string): number {
  return runEndingAt(days, addDays(day, -1))
}

export function bestStreak(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort()
  let best = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && dayDiff(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}
