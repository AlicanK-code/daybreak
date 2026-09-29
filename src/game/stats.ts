import { dayDiff, lastNDays, toDayKey } from '../lib/dates'
import type { Completion, Habit } from '../lib/types'
import { isActiveOn } from './days'

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

export interface DayOverview {
  day: string
  /** habits completed that day, in the order they were ticked off */
  done: { habit: Habit; completion: Completion }[]
  /** habits that existed that day but weren't completed (for today: not completed yet) */
  missed: Habit[]
  xp: number
  /** habits that count for the day: done + missed */
  total: number
  /** every habit that counted was done (and at least one counted) */
  perfect: boolean
}

/**
 * What happened on one day: which habits were done, and which were missed. A habit only counts
 * for days it existed: from the day it was created until the day it was archived. A completion
 * always counts, so history stays intact even if a habit's dates look off.
 */
export function dayOverview(habits: Habit[], completions: Completion[], day: string): DayOverview {
  const doneOn = new Map(completions.filter((c) => c.completedOn === day).map((c) => [c.habitId, c]))
  const done: DayOverview['done'] = []
  const missed: Habit[] = []
  for (const habit of [...habits].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const completion = doneOn.get(habit.id)
    if (completion) {
      done.push({ habit, completion })
      continue
    }
    if (isActiveOn(habit, day)) missed.push(habit)
  }
  done.sort((a, b) => a.completion.completedAt.localeCompare(b.completion.completedAt))
  const total = done.length + missed.length
  return {
    day,
    done,
    missed,
    xp: done.reduce((s, d) => s + d.completion.xpEarned, 0),
    total,
    perfect: total > 0 && missed.length === 0,
  }
}
