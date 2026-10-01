import { addDays } from '../lib/dates'

/** Which days a streak needs. Days that aren't due are skipped: they neither extend nor break it. */
export type IsDue = (day: string) => boolean

const everyDay: IsDue = () => true

/** Stop walking back after this many days in a row with nothing due (e.g. before a habit existed). */
const MAX_GAP = 366

/**
 * Due days in a row that are in `days`, walking back from `end` (inclusive) and skipping days that
 * aren't due. Returns 0 if the latest due day on or before `end` isn't in the set.
 */
export function runEndingAt(days: ReadonlySet<string>, end: string, isDue: IsDue = everyDay): number {
  let n = 0
  let gap = 0
  for (let cursor = end; gap < MAX_GAP; cursor = addDays(cursor, -1)) {
    if (!isDue(cursor)) {
      gap++
      continue
    }
    if (!days.has(cursor)) break
    n++
    gap = 0
  }
  return n
}

/**
 * The live streak as of `today`. A streak stays alive through today even if
 * today isn't done yet — it only breaks once a due day is missed.
 */
export function currentStreak(days: ReadonlySet<string>, today: string, isDue: IsDue = everyDay): number {
  return days.has(today) && isDue(today) ? runEndingAt(days, today, isDue) : runEndingAt(days, addDays(today, -1), isDue)
}

/** Streak the user had going into `day` (used to compute the XP bonus). */
export function streakBefore(days: ReadonlySet<string>, day: string, isDue: IsDue = everyDay): number {
  return runEndingAt(days, addDays(day, -1), isDue)
}

/** No due day falls strictly between `a` and `b` (a < b). */
function adjacentDue(a: string, b: string, isDue: IsDue): boolean {
  for (let d = addDays(a, 1); d < b; d = addDays(d, 1)) if (isDue(d)) return false
  return true
}

export function bestStreak(days: Iterable<string>, isDue: IsDue = everyDay): number {
  const sorted = [...new Set(days)].filter(isDue).sort()
  let best = 0
  let run = 0
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && adjacentDue(sorted[i - 1], sorted[i], isDue) ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}
