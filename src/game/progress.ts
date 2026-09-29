import type { Completion, Habit } from '../lib/types'
import { isActiveOn, isBackfilled } from './days'
import { bestStreak, currentStreak, streakBefore } from './streaks'
import { levelInfo, type LevelInfo } from './xp'

export interface HabitProgress {
  doneToday: boolean
  currentStreak: number
  bestStreak: number
  /** Streak going into today — drives the XP bonus for completing it now. */
  streakBeforeToday: number
  totalCompletions: number
}

export interface Progress {
  level: LevelInfo
  totalCompletions: number
  /** Consecutive days with at least one completion */
  dayStreak: number
  bestDayStreak: number
  /** Days where every active habit was completed */
  perfectDays: number
  hardCompletions: number
  earlyBird: boolean
  nightOwl: boolean
  activeHabitCount: number
  bestHabitStreak: number
  todayDone: number
  todayTotal: number
  xpToday: number
  habits: Map<string, HabitProgress>
}


/**
 * Derives every game number (XP, level, streaks, achievements inputs) from raw
 * habits + completions. Pure: same input, same output — easy to test and cache.
 */
export function computeProgress(habits: Habit[], completions: Completion[], today: string): Progress {
  const byHabit = new Map<string, Set<string>>()
  const byDay = new Map<string, Set<string>>()
  const difficultyById = new Map(habits.map((h) => [h.id, h.difficulty]))

  let totalXp = 0
  let xpToday = 0
  let hardCompletions = 0
  let earlyBird = false
  let nightOwl = false

  for (const c of completions) {
    totalXp += c.xpEarned
    if (c.completedOn === today) xpToday += c.xpEarned
    if (difficultyById.get(c.habitId) === 'hard') hardCompletions++
    // Early Bird / Night Owl are about when a habit was really done, so filled-in days don't count.
    if (!isBackfilled(c)) {
      const hour = new Date(c.completedAt).getHours()
      if (hour < 7) earlyBird = true
      if (hour >= 23) nightOwl = true
    }
    if (!byHabit.has(c.habitId)) byHabit.set(c.habitId, new Set())
    byHabit.get(c.habitId)!.add(c.completedOn)
    if (!byDay.has(c.completedOn)) byDay.set(c.completedOn, new Set())
    byDay.get(c.completedOn)!.add(c.habitId)
  }

  const activeHabits = habits.filter((h) => !h.archivedAt)
  const habitProgress = new Map<string, HabitProgress>()
  let bestHabitStreak = 0
  for (const h of habits) {
    const days = byHabit.get(h.id) ?? new Set<string>()
    const best = bestStreak(days)
    bestHabitStreak = Math.max(bestHabitStreak, best)
    habitProgress.set(h.id, {
      doneToday: days.has(today),
      currentStreak: currentStreak(days, today),
      bestStreak: best,
      streakBeforeToday: streakBefore(days, today),
      totalCompletions: days.size,
    })
  }

  let perfectDays = 0
  for (const [day, done] of byDay) {
    const active = habits.filter((h) => isActiveOn(h, day))
    if (active.length > 0 && active.every((h) => done.has(h.id))) perfectDays++
  }

  const activeDays = new Set(byDay.keys())
  const todayDone = activeHabits.filter((h) => habitProgress.get(h.id)?.doneToday).length

  return {
    level: levelInfo(totalXp),
    totalCompletions: completions.length,
    dayStreak: currentStreak(activeDays, today),
    bestDayStreak: bestStreak(activeDays),
    perfectDays,
    hardCompletions,
    earlyBird,
    nightOwl,
    activeHabitCount: activeHabits.length,
    bestHabitStreak,
    todayDone,
    todayTotal: activeHabits.length,
    xpToday,
    habits: habitProgress,
  }
}
