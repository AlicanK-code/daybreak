import { addDays, toDayKey } from '../lib/dates'
import type { Completion, Habit, NewHabit, Task } from '../lib/types'
import { isScheduledOn } from '../game/schedule'
import { streakBefore } from '../game/streaks'
import { xpForTask } from '../game/tasks'
import { xpForCompletion } from '../game/xp'
import type { Repo } from './repo'

/**
 * Demo mode: everything lives in this browser's localStorage. Lets visitors
 * (e.g. from a portfolio link) try the app without creating an account.
 */

// Keys keep the app's original name (QuestLog) so existing saved data isn't lost.
const STORAGE_KEY = 'questlog-demo-v1'
const NAME_KEY = 'questlog-demo-name'
export const DEMO_DEFAULT_NAME = 'Demo Adventurer'

interface DemoState {
  habits: Habit[]
  completions: Completion[]
  tasks: Task[]
}

let memory: DemoState | null = null

function load(): DemoState {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw) as DemoState
      // Demo data saved before habits had a priority flag or a schedule, or before tasks existed.
      state.habits = state.habits.map((h) => ({ ...h, priority: h.priority ?? false, schedule: h.schedule ?? [] }))
      state.tasks ??= []
      return (memory = state)
    }
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
    localStorage.removeItem(NAME_KEY)
  } catch {
    /* ignore */
  }
}

/** The username chosen in demo mode, kept in this browser alongside the demo data. */
export function readDemoName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || DEMO_DEFAULT_NAME
  } catch {
    return DEMO_DEFAULT_NAME
  }
}

export function writeDemoName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    /* in-memory only: the name lasts until reload */
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
  // The workout is on Mondays, Wednesdays and Fridays, to show off schedules.
  const defs: (NewHabit & { rate: number })[] = [
    { title: 'Morning workout', icon: '🏋️', difficulty: 'hard', priority: true, schedule: [{ from: start, days: [0, 2, 4] }], rate: 0.85 },
    { title: 'Read 20 pages', icon: '📚', difficulty: 'medium', priority: false, schedule: [], rate: 0.85 },
    { title: 'Drink 2L of water', icon: '💧', difficulty: 'easy', priority: false, schedule: [], rate: 0.9 },
    { title: 'Code for 1 hour', icon: '💻', difficulty: 'hard', priority: true, schedule: [], rate: 0.65 },
    { title: 'Plan tomorrow', icon: '🗺️', difficulty: 'easy', priority: false, schedule: [], rate: 0.75 },
  ]
  const habits: Habit[] = defs.map((d, i) => ({
    id: uid(),
    title: d.title,
    icon: d.icon,
    difficulty: d.difficulty,
    priority: d.priority,
    schedule: d.schedule,
    sortOrder: i,
    archivedAt: null,
    createdAt,
  }))

  const rand = mulberry32(42)
  const completions: Completion[] = []
  habits.forEach((h, i) => {
    const days = new Set<string>()
    const scheduled = (d: string) => isScheduledOn(h, d)
    for (let n = HISTORY; n >= 1; n--) {
      const day = addDays(today, -n)
      if (!scheduled(day)) continue
      // Recent weeks go better than early ones — a nice upward story for the charts.
      const momentum = n < 14 ? 0.12 : 0
      if (rand() < defs[i].rate + momentum) {
        const xp = xpForCompletion(h.difficulty, streakBefore(days, day, scheduled))
        days.add(day)
        const hour = 7 + Math.floor(rand() * 14)
        completions.push({ id: uid(), habitId: h.id, completedOn: day, xpEarned: xp, completedAt: `${day}T${String(hour).padStart(2, '0')}:15:00` })
      }
    }
  })
  return { habits, completions, tasks: seedTasks(today) }
}

/** A few one-off tasks: overdue, due today, undated and upcoming, plus some finished in the past. */
function seedTasks(today: string): Task[] {
  const open = (title: string, icon: string, difficulty: Task['difficulty'], due: number | null, added: number): Task => ({
    id: uid(),
    title,
    icon,
    difficulty,
    dueOn: due === null ? null : addDays(today, due),
    completedOn: null,
    completedAt: null,
    xpEarned: 0,
    createdAt: `${addDays(today, -added)}T09:00:00`,
  })
  const done = (title: string, icon: string, difficulty: Task['difficulty'], ago: number): Task => {
    const day = addDays(today, -ago)
    return {
      ...open(title, icon, difficulty, -ago, ago + 3),
      completedOn: day,
      completedAt: `${day}T18:30:00`,
      xpEarned: xpForTask(difficulty),
    }
  }
  return [
    open('Book a dentist appointment', '🦷', 'easy', -2, 6),
    open('Renew passport', '🛂', 'medium', 0, 4),
    open('Fix the bike', '🚲', 'hard', null, 10),
    open('Plan the weekend trip', '🗺️', 'medium', 3, 1),
    done('Clear out the garage', '🧹', 'hard', 5),
    done('Call grandma', '📞', 'easy', 2),
    done('Back up the laptop', '💻', 'medium', 9),
  ]
}

function changeTask(id: string, patch: Partial<Task>): Task {
  const s = load()
  const tasks = s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))
  save({ ...s, tasks })
  const task = tasks.find((t) => t.id === id)
  if (!task) throw new Error('Task not found')
  return task
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

    async reorderHabits(ids) {
      const s = load()
      const rank = new Map(ids.map((id, i) => [id, i]))
      save({ ...s, habits: s.habits.map((h) => (rank.has(h.id) ? { ...h, sortOrder: rank.get(h.id)! } : h)) })
      return delay(undefined)
    },

    async deleteHabit(id) {
      const s = load()
      save({ ...s, habits: s.habits.filter((h) => h.id !== id), completions: s.completions.filter((c) => c.habitId !== id) })
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

    listTasks: () => delay([...load().tasks]),

    async createTask(input) {
      const s = load()
      const task: Task = { ...input, id: uid(), completedOn: null, completedAt: null, xpEarned: 0, createdAt: new Date().toISOString() }
      save({ ...s, tasks: [...s.tasks, task] })
      return delay(task)
    },

    updateTask: (id, patch) => delay(changeTask(id, patch)),

    async deleteTask(id) {
      const s = load()
      save({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })
      return delay(undefined)
    },

    completeTask: (id, day, xpEarned) => delay(changeTask(id, { completedOn: day, completedAt: new Date().toISOString(), xpEarned })),

    reopenTask: (id) => delay(changeTask(id, { completedOn: null, completedAt: null, xpEarned: 0 })),
  }
}
