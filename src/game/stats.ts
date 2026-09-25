import { dayDiff, lastNDays, toDayKey } from '../lib/dates'
import type { Completion, Habit } from '../lib/types'

export interface DayTotal {
  day: string
  xp: number
  count: number
}

/** XP and completion count per day for the last `n` days, oldest first. */
export function dailyTotals(completions: Completion[], n: number, today: string): DayTotal[] {
  const map = new Map<string, DayTotal>(lastNDays(n, today).map((d) => [d, { day: d, xp: 0, count: 0 }]))
  for (const c of completions) {
    const row = map.get(c.completedOn)
    if (row) {
      row.xp += c.xpEarned
      row.count++
    }
  }
  return [...map.values()]
}

/**
 * Share of eligible days in the last `window` days that the habit was completed.
 * Days before the habit was created don't count against it.
 */
export function completionRate(habit: Habit, completions: Completion[], window: number, today: string): number {
  const created = toDayKey(new Date(habit.createdAt))
  const eligible = Math.min(window, dayDiff(created, today) + 1)
  if (eligible <= 0) return 0
  const since = lastNDays(eligible, today)[0]
  const done = completions.filter((c) => c.habitId === habit.id && c.completedOn >= since && c.completedOn <= today).length
  return Math.min(done / eligible, 1)
}
