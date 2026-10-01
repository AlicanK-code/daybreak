import type { Completion, Habit } from '../lib/types'
import { isBackfilled } from './days'
import { isDueOn, isScheduledOn } from './schedule'
import { bestStreak, currentStreak, streakBefore } from './streaks'
import { levelInfo, type LevelInfo } from './xp'

export interface HabitProgress {
  doneToday: boolean
  /** scheduled for today (and switched on); habits that aren't due can still be done as an extra */
  dueToday: boolean
  currentStreak: number
  bestStreak: number
  /** Streak going into today — drives the XP bonus for completing it now. */
  streakBeforeToday: number
  totalCompletions: number
}

export interface Progress {
  level: LevelInfo
  totalCompletions: number
  /** Consecutive days with at least one completion; days with nothing due are skipped */
  dayStreak: number
  bestDayStreak: number
  /** Days where every habit that was due was completed */
  perfectDays: number
  hardCompletions: number
  earlyBird: boolean
  nightOwl: boolean
  activeHabitCount: number
  bestHabitStreak: number
  /** habits due today that are done */
  todayDone: number
  /** habits due today */
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
    // A habit's streak counts the days it's scheduled; extras on other days don't change it.
    const scheduled = (d: string) => isScheduledOn(h, d)
    const best = bestStreak(days, scheduled)
    bestHabitStreak = Math.max(bestHabitStreak, best)
    habitProgress.set(h.id, {
      doneToday: days.has(today),
      dueToday: isDueOn(h, today),
      currentStreak: currentStreak(days, today, scheduled),
      bestStreak: best,
      streakBeforeToday: streakBefore(days, today, scheduled),
      totalCompletions: days.size,
    })
  }

  let perfectDays = 0
  for (const [day, done] of byDay) {
    const due = habits.filter((h) => isDueOn(h, day))
    if (due.length > 0 && due.every((h) => done.has(h.id))) perfectDays++
  }

  // The day streak needs a completion on every day something was due; a day with nothing due is
  // skipped, unless something was done anyway.
  const activeDays = new Set(byDay.keys())
  const dayCounts = (day: string) => activeDays.has(day) || habits.some((h) => isDueOn(h, day))
  const dueToday = activeHabits.filter((h) => habitProgress.get(h.id)?.dueToday)
  const todayDone = dueToday.filter((h) => habitProgress.get(h.id)?.doneToday).length

  return {
    level: levelInfo(totalXp),
    totalCompletions: completions.length,
    dayStreak: currentStreak(activeDays, today, dayCounts),
    bestDayStreak: bestStreak(activeDays, dayCounts),
    perfectDays,
    hardCompletions,
    earlyBird,
    nightOwl,
    activeHabitCount: activeHabits.length,
    bestHabitStreak,
    todayDone,
    todayTotal: dueToday.length,
    xpToday,
    habits: habitProgress,
  }
}
