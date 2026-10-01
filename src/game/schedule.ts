import { weekday } from '../lib/dates'
import type { Habit, SchedulePeriod } from '../lib/types'
import { isActiveOn } from './days'

/** Weekdays, 0 = Monday … 6 = Sunday. */
export const EVERY_DAY: readonly number[] = [0, 1, 2, 3, 4, 5, 6]

/**
 * The weekdays a habit is due on `day`: those of the last schedule period that started on or before
 * it. Before the first period (and for habits that never had one) a habit is due every day.
 */
export function scheduleOn(habit: Pick<Habit, 'schedule'>, day: string): readonly number[] {
  let days = EVERY_DAY
  for (const p of habit.schedule) if (p.from <= day) days = p.days
  return days
}

/** The habit's schedule says it's due on this weekday (whether or not it existed yet). */
export function isScheduledOn(habit: Pick<Habit, 'schedule'>, day: string): boolean {
  return scheduleOn(habit, day).includes(weekday(day))
}

/** The habit counts on this day: it existed, wasn't turned off, and was scheduled. */
export function isDueOn(habit: Habit, day: string): boolean {
  return isActiveOn(habit, day) && isScheduledOn(habit, day)
}

const sameDays = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((d, i) => d === b[i])

/**
 * The schedule after changing it to `days` on `today`. The change applies from today on, so past days
 * keep the schedule they had (and the streaks built on it). Changing it again on the same day just
 * replaces today's change.
 */
export function withSchedule(schedule: readonly SchedulePeriod[], days: readonly number[], today: string): SchedulePeriod[] {
  const sorted = [...new Set(days)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b)
  const kept = schedule.filter((p) => p.from < today)
  const before = kept.length ? kept[kept.length - 1].days : EVERY_DAY
  return sameDays(before, sorted) ? kept : [...kept, { from: today, days: sorted }]
}

const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** "Every day", "Weekdays", "Weekends" or a list like "Mon, Wed, Fri". */
export function scheduleLabel(days: readonly number[]): string {
  const key = [...days].sort((a, b) => a - b).join()
  if (key === EVERY_DAY.join()) return 'Every day'
  if (key === '0,1,2,3,4') return 'Weekdays'
  if (key === '5,6') return 'Weekends'
  return [...days].sort((a, b) => a - b).map((d) => SHORT[d]).join(', ')
}
