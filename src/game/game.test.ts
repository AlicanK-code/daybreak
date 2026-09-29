import { describe, expect, it } from 'vitest'
import { addDays, dayDiff, lastNDays, weekday } from '../lib/dates'
import type { Completion, Habit } from '../lib/types'
import { BADGES, unlockedBadgeIds } from './badges'
import { computeProgress } from './progress'
import { completionRate, dailyTotals, dayOverview } from './stats'
import { EDIT_WINDOW_DAYS, canEditHabitOn, isEditableDay, xpForDay } from './backfill'
import { isBackfilled } from './days'
import { bestStreak, currentStreak, streakBefore } from './streaks'
import { levelInfo, xpForCompletion, xpToReachLevel } from './xp'

const TODAY = '2026-09-24'

const habit = (id: string, over: Partial<Habit> = {}): Habit => ({
  id,
  title: id,
  icon: '⭐',
  difficulty: 'medium',
  sortOrder: 0,
  priority: false,
  archivedAt: null,
  createdAt: '2026-01-01T09:00:00',
  ...over,
})

let seq = 0
const done = (habitId: string, day: string, xp = 20, time = '12:00:00'): Completion => ({
  id: `c${seq++}`,
  habitId,
  completedOn: day,
  xpEarned: xp,
  completedAt: `${day}T${time}`,
})

describe('dates', () => {
  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30') // UK clocks change
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('diffs and lists days', () => {
    expect(dayDiff('2026-09-20', TODAY)).toBe(4)
    expect(lastNDays(3, TODAY)).toEqual(['2026-09-22', '2026-09-23', TODAY])
    expect(weekday(TODAY)).toBe(3) // Thursday
  })
})

describe('xp & levels', () => {
  it('scales by difficulty and streak, capped at +50%', () => {
    expect(xpForCompletion('easy', 0)).toBe(10)
    expect(xpForCompletion('medium', 0)).toBe(20)
    expect(xpForCompletion('hard', 0)).toBe(35)
    expect(xpForCompletion('medium', 4)).toBe(24)
    expect(xpForCompletion('hard', 10)).toBe(53)
    expect(xpForCompletion('hard', 99)).toBe(53)
  })
  it('has a strictly increasing level curve', () => {
    for (let l = 1; l < 50; l++) expect(xpToReachLevel(l + 1)).toBeGreaterThan(xpToReachLevel(l))
  })
  it('computes level and progress from total XP', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, title: 'Novice', xpIntoLevel: 0, progress: 0 })
    expect(levelInfo(59).level).toBe(1)
    expect(levelInfo(60).level).toBe(2)
    const l = levelInfo(xpToReachLevel(5) + 10)
    expect(l.level).toBe(5)
    expect(l.title).toBe('Adventurer')
    expect(l.xpIntoLevel).toBe(10)
    expect(l.progress).toBeGreaterThan(0)
    expect(l.progress).toBeLessThan(1)
  })
})

describe('streaks', () => {
  const days = new Set(['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23'])
  it('keeps a streak alive until the end of today', () => {
    expect(currentStreak(days, TODAY)).toBe(4)
    expect(currentStreak(new Set([...days, TODAY]), TODAY)).toBe(5)
  })
  it('breaks after a full missed day', () => {
    expect(currentStreak(days, '2026-09-25')).toBe(0)
  })
  it('computes streak before a day and best streak', () => {
    expect(streakBefore(days, TODAY)).toBe(4)
    expect(bestStreak(['2026-09-01', '2026-09-02', '2026-09-05', '2026-09-06', '2026-09-07'])).toBe(3)
    expect(bestStreak([])).toBe(0)
  })
})

describe('computeProgress', () => {
  it('derives totals, today status and perfect days', () => {
    const habits = [habit('a'), habit('b', { difficulty: 'hard' })]
    const completions = [
      done('a', '2026-09-22'),
      done('b', '2026-09-22', 35),
      done('a', '2026-09-23'),
      done('a', TODAY, 20, '06:30:00'),
    ]
    const p = computeProgress(habits, completions, TODAY)
    expect(p.level.totalXp).toBe(95)
    expect(p.level.level).toBe(2)
    expect(p.totalCompletions).toBe(4)
    expect(p.perfectDays).toBe(1) // only the 22nd had both
    expect(p.hardCompletions).toBe(1)
    expect(p.dayStreak).toBe(3)
    expect(p.earlyBird).toBe(true)
    expect(p.nightOwl).toBe(false)
    expect(p.todayDone).toBe(1)
    expect(p.todayTotal).toBe(2)
    expect(p.habits.get('a')).toMatchObject({ doneToday: true, currentStreak: 3, streakBeforeToday: 2 })
    expect(p.habits.get('b')).toMatchObject({ doneToday: false, currentStreak: 0 })
  })

  it("doesn't require habits that didn't exist yet for a perfect day", () => {
    const habits = [habit('a'), habit('new', { createdAt: `${TODAY}T08:00:00` })]
    const p = computeProgress(habits, [done('a', '2026-09-23')], TODAY)
    expect(p.perfectDays).toBe(1)
  })

  it('excludes archived habits from today’s total', () => {
    const habits = [habit('a'), habit('old', { archivedAt: '2026-09-01T10:00:00' })]
    expect(computeProgress(habits, [], TODAY).todayTotal).toBe(1)
  })
})

describe('badges', () => {
  it('unlocks nothing for a fresh user', () => {
    expect(unlockedBadgeIds(computeProgress([], [], TODAY)).size).toBe(0)
  })
  it('unlocks first quest, streak and perfect-day badges', () => {
    const days = lastNDays(7, TODAY)
    const p = computeProgress([habit('a')], days.map((d) => done('a', d)), TODAY)
    const ids = unlockedBadgeIds(p)
    expect(ids).toContain('first-quest')
    expect(ids).toContain('streak-3')
    expect(ids).toContain('streak-7')
    expect(ids).toContain('perfect-7')
    expect(ids).not.toContain('streak-30')
  })
  it('has unique ids', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
  })
})

describe('stats', () => {
  it('sums XP per day', () => {
    const t = dailyTotals([done('a', TODAY, 20), done('b', TODAY, 35), done('a', '2026-01-01')], 7, TODAY)
    expect(t).toHaveLength(7)
    expect(t[6]).toEqual({ day: TODAY, xp: 55, count: 2 })
    expect(t[0].xp).toBe(0)
  })
  it('only counts days since the habit was created', () => {
    const h = habit('a', { createdAt: '2026-09-23T10:00:00' })
    expect(completionRate(h, [done('a', TODAY)], 30, TODAY)).toBe(0.5)
  })
})

describe('dayOverview', () => {
  const DAY = '2026-09-20'

  it('splits the day into done and missed habits, in list order', () => {
    const habits = [habit('b', { sortOrder: 1 }), habit('a', { sortOrder: 0 }), habit('c', { sortOrder: 2 })]
    const o = dayOverview(habits, [done('b', DAY, 35)], DAY)
    expect(o.done.map((d) => d.habit.id)).toEqual(['b'])
    expect(o.missed.map((h) => h.id)).toEqual(['a', 'c'])
    expect(o.total).toBe(3)
    expect(o.xp).toBe(35)
    expect(o.perfect).toBe(false)
  })

  it('lists completions in the order they were ticked off', () => {
    const habits = [habit('a', { sortOrder: 0 }), habit('b', { sortOrder: 1 })]
    const o = dayOverview(habits, [done('a', DAY, 20, '21:00:00'), done('b', DAY, 20, '07:30:00')], DAY)
    expect(o.done.map((d) => d.habit.id)).toEqual(['b', 'a'])
  })

  it('only counts completions from that day', () => {
    const o = dayOverview([habit('a')], [done('a', addDays(DAY, -1)), done('a', addDays(DAY, 1))], DAY)
    expect(o.done).toHaveLength(0)
    expect(o.missed.map((h) => h.id)).toEqual(['a'])
    expect(o.xp).toBe(0)
  })

  it("doesn't count a habit as missed before it was created", () => {
    const habits = [habit('a'), habit('new', { createdAt: `${addDays(DAY, 1)}T08:00:00` })]
    expect(dayOverview(habits, [], DAY).missed.map((h) => h.id)).toEqual(['a'])
    // It does count from its first day.
    expect(dayOverview(habits, [], addDays(DAY, 1)).missed.map((h) => h.id)).toEqual(['a', 'new'])
  })

  it("doesn't count a habit as missed from the day it was archived", () => {
    const habits = [habit('a'), habit('old', { archivedAt: `${DAY}T10:00:00` })]
    expect(dayOverview(habits, [], DAY).missed.map((h) => h.id)).toEqual(['a'])
    expect(dayOverview(habits, [], addDays(DAY, -1)).missed.map((h) => h.id)).toEqual(['a', 'old'])
  })

  it('keeps a completion even if the habit was archived or created later', () => {
    const habits = [habit('old', { archivedAt: `${addDays(DAY, -5)}T10:00:00`, createdAt: `${addDays(DAY, 2)}T08:00:00` })]
    const o = dayOverview(habits, [done('old', DAY, 15)], DAY)
    expect(o.done.map((d) => d.habit.id)).toEqual(['old'])
    expect(o.perfect).toBe(true)
  })

  it('calls a day perfect only when every habit that counted was done', () => {
    const habits = [habit('a'), habit('b')]
    expect(dayOverview(habits, [done('a', DAY), done('b', DAY)], DAY).perfect).toBe(true)
    expect(dayOverview([], [], DAY)).toMatchObject({ total: 0, perfect: false })
  })
})

describe('turning habits off and on', () => {
  it('stops counting a habit from the day it is turned off', () => {
    const off = habit('a', { archivedAt: `${addDays(TODAY, -3)}T09:00:00` })
    expect(dayOverview([off], [], addDays(TODAY, -4)).missed).toHaveLength(1)
    expect(dayOverview([off], [], addDays(TODAY, -3)).missed).toHaveLength(0)
    expect(dayOverview([off], [], TODAY).total).toBe(0)
  })

  it('counts every day again once turned back on, including the days it was off', () => {
    const backOn = habit('a', { archivedAt: null })
    expect(dayOverview([backOn], [], addDays(TODAY, -3)).missed).toHaveLength(1)
    expect(computeProgress([backOn], [], TODAY).todayTotal).toBe(1)
  })
})

describe('changing past days', () => {
  it('allows today and the last week, but not the future or older days', () => {
    expect(isEditableDay(TODAY, TODAY)).toBe(true)
    expect(isEditableDay(addDays(TODAY, -1), TODAY)).toBe(true)
    expect(isEditableDay(addDays(TODAY, -EDIT_WINDOW_DAYS), TODAY)).toBe(true)
    expect(isEditableDay(addDays(TODAY, -EDIT_WINDOW_DAYS - 1), TODAY)).toBe(false)
    expect(isEditableDay(addDays(TODAY, 1), TODAY)).toBe(false)
  })

  it("won't change a habit on a day before it existed or after it was archived", () => {
    const yesterday = addDays(TODAY, -1)
    expect(canEditHabitOn(habit('a'), yesterday, TODAY)).toBe(true)
    expect(canEditHabitOn(habit('new', { createdAt: `${TODAY}T08:00:00` }), yesterday, TODAY)).toBe(false)
    expect(canEditHabitOn(habit('old', { archivedAt: `${addDays(TODAY, -3)}T08:00:00` }), yesterday, TODAY)).toBe(false)
  })

  it('gives a filled-in day the XP it would have earned on time, streak bonus included', () => {
    const h = habit('a', { difficulty: 'hard' })
    const day = addDays(TODAY, -2)
    // Done on the 3 days before it: a 3-day streak going into it, so +15%.
    const history = [1, 2, 3].map((n) => done('a', addDays(day, -n)))
    expect(xpForDay(h, history, day)).toBe(xpForCompletion('hard', 3))
    // With nothing before it, just the base XP.
    expect(xpForDay(h, [], day)).toBe(xpForCompletion('hard', 0))
  })

  it("doesn't let a day's own completion or other habits affect its XP", () => {
    const h = habit('a')
    const day = addDays(TODAY, -2)
    const noise = [done('a', day), done('b', addDays(day, -1)), done('b', addDays(day, -2))]
    expect(xpForDay(h, noise, day)).toBe(xpForCompletion('medium', 0))
  })

  it('heals the streak when a missed day is filled in, without touching XP already earned', () => {
    const h = habit('a')
    const gap = addDays(TODAY, -2)
    const before = [done('a', addDays(TODAY, -3), 20), done('a', addDays(TODAY, -1), 20), done('a', TODAY, 20)]
    expect(computeProgress([h], before, TODAY).habits.get('a')!.currentStreak).toBe(2)
    const filled = [...before, done('a', gap, xpForDay(h, before, gap))]
    const p = computeProgress([h], filled, TODAY)
    expect(p.habits.get('a')!.currentStreak).toBe(4)
    expect(p.level.totalXp).toBe(60 + xpForDay(h, before, gap))
  })

  it('spots completions that were added after the fact', () => {
    expect(isBackfilled(done('a', TODAY, 20, '09:00:00'))).toBe(false)
    const late = { ...done('a', addDays(TODAY, -2)), completedAt: `${TODAY}T09:00:00` }
    expect(isBackfilled(late)).toBe(true)
  })

  it("doesn't award Early Bird or Night Owl for filled-in days", () => {
    const early = { ...done('a', addDays(TODAY, -1)), completedAt: `${TODAY}T06:00:00` }
    const night = { ...done('b', addDays(TODAY, -2)), completedAt: `${TODAY}T23:30:00` }
    const p = computeProgress([habit('a'), habit('b')], [early, night], TODAY)
    expect(p.earlyBird).toBe(false)
    expect(p.nightOwl).toBe(false)
    // Done on the day itself, the same times still count.
    const onTime = computeProgress([habit('a')], [done('a', TODAY, 20, '06:00:00')], TODAY)
    expect(onTime.earlyBird).toBe(true)
  })
})
