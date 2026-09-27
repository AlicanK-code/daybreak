import type { Completion, Habit, HabitPatch, NewCompletion, NewHabit } from '../lib/types'

/**
 * Storage abstraction. The UI only talks to this interface, so the same app
 * runs against Supabase (real accounts) or the browser (demo mode) — and a
 * future backend is a new implementation, not a rewrite.
 */
export interface Repo {
  listHabits(): Promise<Habit[]>
  createHabit(input: NewHabit): Promise<Habit>
  updateHabit(id: string, patch: HabitPatch): Promise<Habit>
  deleteHabit(id: string): Promise<void>
  /** Saves a new manual order: the listed habits get sortOrder 0, 1, 2… in that order. */
  reorderHabits(ids: string[]): Promise<void>
  listCompletions(): Promise<Completion[]>
  addCompletion(input: NewCompletion): Promise<Completion>
  removeCompletion(habitId: string, day: string): Promise<void>
}
