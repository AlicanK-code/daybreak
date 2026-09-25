import type { Difficulty } from '../lib/types'

export const BASE_XP: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 35 }

/** Each consecutive prior day adds +5% XP, capped at +50% (a 10-day streak). */
export const STREAK_BONUS_PER_DAY = 0.05
export const STREAK_BONUS_CAP_DAYS = 10

export function streakMultiplier(streakBefore: number): number {
  return 1 + Math.min(Math.max(streakBefore, 0), STREAK_BONUS_CAP_DAYS) * STREAK_BONUS_PER_DAY
}

/**
 * XP for completing a habit.
 * @param streakBefore consecutive days the habit was completed, ending yesterday
 */
export function xpForCompletion(difficulty: Difficulty, streakBefore: number): number {
  return Math.round(BASE_XP[difficulty] * streakMultiplier(streakBefore))
}

/** Total XP required to reach `level` (level 1 starts at 0). Early levels come fast, later ones take real consistency. */
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(60 * Math.pow(level - 1, 1.8))
}

export interface LevelInfo {
  level: number
  title: string
  totalXp: number
  xpIntoLevel: number
  xpForNextLevel: number
  /** 0..1 progress through the current level */
  progress: number
}

const TITLES: [number, string][] = [
  [1, 'Novice'],
  [3, 'Apprentice'],
  [5, 'Adventurer'],
  [8, 'Knight'],
  [12, 'Champion'],
  [16, 'Hero'],
  [20, 'Legend'],
  [30, 'Mythic'],
]

export function titleForLevel(level: number): string {
  let title = TITLES[0][1]
  for (const [min, t] of TITLES) if (level >= min) title = t
  return title
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1
  while (xpToReachLevel(level + 1) <= totalXp) level++
  const floor = xpToReachLevel(level)
  const next = xpToReachLevel(level + 1)
  return {
    level,
    title: titleForLevel(level),
    totalXp,
    xpIntoLevel: totalXp - floor,
    xpForNextLevel: next - floor,
    progress: (totalXp - floor) / (next - floor),
  }
}
