import { addDays, toDayKey } from '../lib/dates'
import type { Completion, Habit, NewHabit } from '../lib/types'
import { streakBefore } from '../game/streaks'
import { xpForCompletion } from '../game/xp'
import type { Repo } from './repo'

/**
 * Demo mode: everything lives in this browser's localStorage. Lets visitors
 * (e.g. from a portfolio link) try the app without creating an account.
 */

const STORAGE_KEY = 'questlog-demo-v1'

interface DemoState {
  habits: Habit[]
  completions: Completion[]
}

let memory: DemoState | null = null

function load(): DemoState {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return (memory = JSON.parse(raw) as DemoState)
  } catch {
    /* storage unavailable — fall through to seed */
  }
  memory = seed()
  save(memory)
  return memory
}

function save(state: DemoState) {
  memory = state
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* in-memory only */
  }
}

export function resetDemo() {
  memory = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

const uid = () => crypto.randomUUID()

/** Small deterministic PRNG so the seeded history looks the same every time. */
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seed(): DemoState {
  const today = toDayKey()
  const HISTORY = 28
  const start = addDays(today, -HISTORY)
  const createdAt = `${start}T08:00:00`
  const defs: (NewHabit & { rate: number })[] = [
    { title: 'Morning workout', icon: '🏋️', difficulty: 'hard', rate: 0.7 },
    { title: 'Read 20 pages', icon: '📚', difficulty: 'medium', rate: 0.85 },
    { title: 'Drink 2L of water', icon: '💧', difficulty: 'easy', rate: 0.9 },
    { title: 'Code for 1 hour', icon: '💻', difficulty: 'hard', rate: 0.65 },
    { title: 'Plan tomorrow', icon: '🗺️', difficulty: 'easy', rate: 0.75 },
  ]
  const habits: Habit[] = defs.map((d, i) => ({
    id: uid(),
    title: d.title,
    icon: d.icon,
    difficulty: d.difficulty,
    sortOrder: i,
    archivedAt: null,
    createdAt,
  }))

  const rand = mulberry32(42)
  const completions: Completion[] = []
  habits.forEach((h, i) => {
    const days = new Set<string>()
    for (let n = HISTORY; n >= 1; n--) {
      const day = addDays(today, -n)
      // Recent weeks go better than early ones — a nice upward story for the charts.
      const momentum = n < 14 ? 0.12 : 0
      if (rand() < defs[i].rate + momentum) {
        const xp = xpForCompletion(h.difficulty, streakBefore(days, day))
        days.add(day)
        const hour = 7 + Math.floor(rand() * 14)
        completions.push({ id: uid(), habitId: h.id, completedOn: day, xpEarned: xp, completedAt: `${day}T${String(hour).padStart(2, '0')}:15:00` })
      }
    }
  })
  return { habits, completions }
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 60))

export function createDemoRepo(): Repo {
  return {
    listHabits: () => delay([...load().habits].sort((a, b) => a.sortOrder - b.sortOrder)),

    async createHabit(input) {
      const s = load()
      const habit: Habit = { ...input, id: uid(), sortOrder: s.habits.length, archivedAt: null, createdAt: new Date().toISOString() }
      save({ ...s, habits: [...s.habits, habit] })
      return delay(habit)
    },

    async updateHabit(id, patch) {
      const s = load()
      const habits = s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h))
      save({ ...s, habits })
      return delay(habits.find((h) => h.id === id)!)
    },

    async deleteHabit(id) {
      const s = load()
      save({ habits: s.habits.filter((h) => h.id !== id), completions: s.completions.filter((c) => c.habitId !== id) })
      return delay(undefined)
    },

    listCompletions: () => delay([...load().completions]),

    async addCompletion(input) {
      const s = load()
      if (s.completions.some((c) => c.habitId === input.habitId && c.completedOn === input.completedOn)) {
        throw new Error('Already completed today')
      }
      const c: Completion = { ...input, id: uid(), completedAt: new Date().toISOString() }
      save({ ...s, completions: [...s.completions, c] })
      return delay(c)
    },

    async removeCompletion(habitId, day) {
      const s = load()
      save({ ...s, completions: s.completions.filter((c) => !(c.habitId === habitId && c.completedOn === day)) })
      return delay(undefined)
    },
  }
}
