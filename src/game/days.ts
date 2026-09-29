import { toDayKey } from '../lib/dates'
import type { Completion, Habit } from '../lib/types'

const dayOf = (iso: string) => toDayKey(new Date(iso))

/** A habit counts on a day from the day it was created until (not including) the day it was archived. */
export function isActiveOn(habit: Habit, day: string): boolean {
  if (dayOf(habit.createdAt) > day) return false
  if (habit.archivedAt && dayOf(habit.archivedAt) <= day) return false
  return true
}

/** A completion was added after the fact: it was ticked off on a later day than the one it counts for. */
export function isBackfilled(c: Completion): boolean {
  return dayOf(c.completedAt) !== c.completedOn
}
