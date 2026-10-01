import { dayDiff } from '../lib/dates'
import type { Completion, Habit } from '../lib/types'
import { isActiveOn } from './days'
import { isScheduledOn } from './schedule'
import { streakBefore } from './streaks'
import { xpForCompletion } from './xp'

/**
 * Past days can be filled in (or undone) for a week, so a forgotten tick doesn't cost a streak,
 * without letting XP be farmed from months of history.
 */
export const EDIT_WINDOW_DAYS = 7

/** Today and the EDIT_WINDOW_DAYS days before it can be changed; the future and older days can't. */
export function isEditableDay(day: string, today: string): boolean {
  const ago = dayDiff(day, today)
  return ago >= 0 && ago <= EDIT_WINDOW_DAYS
}

/**
 * A habit can be changed on a day that's in the window and that the habit existed on. (Only due days
 * are offered for filling in, but an extra done on an off day can still be undone.)
 */
export function canEditHabitOn(habit: Habit, day: string, today: string): boolean {
  return isEditableDay(day, today) && isActiveOn(habit, day)
}

/**
 * XP for completing a habit on `day`, as if it had been done on time: the streak bonus uses the run
 * of days before it. Completions on later days keep the XP they already earned.
 */
export function xpForDay(habit: Habit, completions: Completion[], day: string): number {
  const days = new Set(completions.filter((c) => c.habitId === habit.id && c.completedOn !== day).map((c) => c.completedOn))
  return xpForCompletion(habit.difficulty, streakBefore(days, day, (d) => isScheduledOn(habit, d)))
}
