export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Habit {
  id: string
  title: string
  icon: string
  difficulty: Difficulty
  sortOrder: number
  /** marked as important; shown with a Priority label */
  priority: boolean
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

export type NewHabit = Pick<Habit, 'title' | 'icon' | 'difficulty' | 'priority'>
export type HabitPatch = Partial<Pick<Habit, 'title' | 'icon' | 'difficulty' | 'priority' | 'sortOrder' | 'archivedAt'>>
export type NewCompletion = Omit<Completion, 'id' | 'completedAt'>
