import { addDays, dayDiff } from '../lib/dates'
import type { Difficulty, Task } from '../lib/types'
import { BASE_XP } from './xp'

/** A task earns its difficulty's base XP. There's no streak, so no bonus. */
export function xpForTask(difficulty: Difficulty): number {
  return BASE_XP[difficulty]
}

/** How far ahead a due date can be set, to catch typos in the year. */
export const MAX_DUE_YEARS = 5

/**
 * The range a due date can be picked from. It starts today: a task can't be set up as already late.
 * The one exception is a task that's already overdue, which keeps its own date when edited (so fixing
 * its title doesn't force a new date), but can't be moved further back.
 */
export function dueDateRange(today: string, current?: string | null): { min: string; max: string } {
  return {
    min: current && current < today ? current : today,
    max: addDays(today, MAX_DUE_YEARS * 365),
  }
}

/** Why a due date can't be used, or null if it's fine (no date is always fine). */
export function dueDateProblem(dueOn: string | null, today: string, current?: string | null): string | null {
  if (dueOn === null) return null
  const { min, max } = dueDateRange(today, current)
  if (dueOn < min) return 'Pick today or a later date.'
  if (dueOn > max) return `Pick a date within the next ${MAX_DUE_YEARS} years.`
  return null
}

export type TaskStatus = 'done' | 'overdue' | 'today' | 'someday' | 'upcoming'

export function taskStatus(task: Task, today: string): TaskStatus {
  if (task.completedOn) return 'done'
  if (task.dueOn === null) return 'someday'
  if (task.dueOn < today) return 'overdue'
  return task.dueOn === today ? 'today' : 'upcoming'
}

/** Whole days past its due date (0 if it isn't overdue). */
export function daysLate(task: Task, today: string): number {
  return task.dueOn && !task.completedOn ? Math.max(dayDiff(task.dueOn, today), 0) : 0
}

const RANK: Record<TaskStatus, number> = { overdue: 0, today: 1, someday: 2, upcoming: 3, done: 4 }

/**
 * Tasks for the Today screen: open ones that are overdue, due today or undated, and ones finished
 * today (kept, ticked, so a mis-tap can be undone). Overdue first (oldest first), then due today,
 * then undated, each in the order they were added; finished ones last.
 */
export function todayTasks(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((t) => (t.completedOn ? t.completedOn === today : t.dueOn === null || t.dueOn <= today))
    .sort((a, b) => {
      const sa = taskStatus(a, today)
      const sb = taskStatus(b, today)
      if (sa !== sb) return RANK[sa] - RANK[sb]
      if (sa === 'done') return (a.completedAt ?? '').localeCompare(b.completedAt ?? '')
      if (sa === 'overdue' && a.dueOn !== b.dueOn) return a.dueOn!.localeCompare(b.dueOn!)
      return a.createdAt.localeCompare(b.createdAt)
    })
}

/** Open tasks due after today, soonest first. */
export function upcomingTasks(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((t) => taskStatus(t, today) === 'upcoming')
    .sort((a, b) => a.dueOn!.localeCompare(b.dueOn!) || a.createdAt.localeCompare(b.createdAt))
}

/** Tasks ticked off on a given day, in the order they were done. */
export function tasksDoneOn(tasks: Task[], day: string): Task[] {
  return tasks.filter((t) => t.completedOn === day).sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
}
