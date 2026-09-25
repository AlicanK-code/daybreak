import type { Progress } from './progress'

export type Tier = 'bronze' | 'silver' | 'gold'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  tier: Tier
  /** Returns 0..1 so locked badges can show how close you are. */
  progress: (p: Progress) => number
}

const ratio = (value: number, target: number) => Math.min(value / target, 1)

export const BADGES: Badge[] = [
  { id: 'first-quest', name: 'First Quest', description: 'Complete your first habit', icon: '🗡️', tier: 'bronze', progress: (p) => ratio(p.totalCompletions, 1) },
  { id: 'collector', name: 'Quest Board', description: 'Track 5 habits at once', icon: '📜', tier: 'bronze', progress: (p) => ratio(p.activeHabitCount, 5) },
  { id: 'streak-3', name: 'On a Roll', description: 'Reach a 3-day streak on any habit', icon: '🔥', tier: 'bronze', progress: (p) => ratio(p.bestHabitStreak, 3) },
  { id: 'perfect-day', name: 'Flawless', description: 'Complete every habit in a single day', icon: '💎', tier: 'bronze', progress: (p) => ratio(p.perfectDays, 1) },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete a habit before 7am', icon: '🌅', tier: 'bronze', progress: (p) => (p.earlyBird ? 1 : 0) },
  { id: 'night-owl', name: 'Night Owl', description: 'Complete a habit after 11pm', icon: '🦉', tier: 'bronze', progress: (p) => (p.nightOwl ? 1 : 0) },
  { id: 'level-5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', tier: 'silver', progress: (p) => ratio(p.level.level, 5) },
  { id: 'streak-7', name: 'Week Warrior', description: 'Reach a 7-day streak on any habit', icon: '⚔️', tier: 'silver', progress: (p) => ratio(p.bestHabitStreak, 7) },
  { id: 'hard-10', name: 'Glutton for Punishment', description: 'Complete 10 hard habits', icon: '🏋️', tier: 'silver', progress: (p) => ratio(p.hardCompletions, 10) },
  { id: 'perfect-7', name: 'Perfectionist', description: 'Have 7 perfect days', icon: '👑', tier: 'silver', progress: (p) => ratio(p.perfectDays, 7) },
  { id: 'century', name: 'Centurion', description: 'Complete 100 habits', icon: '🛡️', tier: 'gold', progress: (p) => ratio(p.totalCompletions, 100) },
  { id: 'streak-30', name: 'Unstoppable', description: 'Reach a 30-day streak on any habit', icon: '🌋', tier: 'gold', progress: (p) => ratio(p.bestHabitStreak, 30) },
  { id: 'level-10', name: 'Veteran', description: 'Reach level 10', icon: '🏆', tier: 'gold', progress: (p) => ratio(p.level.level, 10) },
  { id: 'level-20', name: 'Living Legend', description: 'Reach level 20', icon: '🐉', tier: 'gold', progress: (p) => ratio(p.level.level, 20) },
]

export function unlockedBadgeIds(p: Progress): Set<string> {
  return new Set(BADGES.filter((b) => b.progress(p) >= 1).map((b) => b.id))
}
