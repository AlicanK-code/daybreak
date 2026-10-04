export type Difficulty = 'easy' | 'medium' | 'hard'

/** From `from` (a day key) on, the habit is due on these weekdays (0 = Monday … 6 = Sunday). */
export interface SchedulePeriod {
  from: string
  days: number[]
}

export interface Habit {
  id: string
  title: string
  icon: string
  difficulty: Difficulty
  sortOrder: number
  /** marked as important; shown with a Priority label */
  priority: boolean
  /**
   * When the habit is due, oldest change first. Empty means every day. Kept as a history so changing
   * the schedule doesn't rewrite past days.
   */
  schedule: SchedulePeriod[]
  archivedAt: string | null
  createdAt: string
}

export interface Completion {
  id: string
  habitId: string
  /** Local calendar day, YYYY-MM-DD */
  completedOn: string
  xpEarned: number
  /** ISO timestamp */
  completedAt: string
}

export type NewHabit = Pick<Habit, 'title' | 'icon' | 'difficulty' | 'priority' | 'schedule'>
export type HabitPatch = Partial<Pick<Habit, 'title' | 'icon' | 'difficulty' | 'priority' | 'schedule' | 'sortOrder' | 'archivedAt'>>
export type NewCompletion = Omit<Completion, 'id' | 'completedAt'>

/** A one-off task: done once, optionally by a due date. No schedule or streak. */
export interface Task {
  id: string
  title: string
  icon: string
  difficulty: Difficulty
  /** Local calendar day it's due (YYYY-MM-DD), or null for "someday" */
  dueOn: string | null
  /** Local calendar day it was ticked off, or null while it's still open */
  completedOn: string | null
  /** ISO timestamp it was ticked off, or null while it's still open */
  completedAt: string | null
  /** XP it earned when ticked off; 0 while open */
  xpEarned: number
  createdAt: string
}

export type NewTask = Pick<Task, 'title' | 'icon' | 'difficulty' | 'dueOn'>
export type TaskPatch = Partial<NewTask>
