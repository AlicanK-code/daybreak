export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Habit {
  id: string
  title: string
  icon: string
  difficulty: Difficulty
  sortOrder: number
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

export type NewHabit = Pick<Habit, 'title' | 'icon' | 'difficulty'>
export type HabitPatch = Partial<Pick<Habit, 'title' | 'icon' | 'difficulty' | 'sortOrder' | 'archivedAt'>>
export type NewCompletion = Omit<Completion, 'id' | 'completedAt'>
