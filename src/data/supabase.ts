import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Completion, Habit, HabitPatch, NewCompletion, NewHabit } from '../lib/types'
import type { Repo } from './repo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when env vars are missing — the app then offers demo mode only. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

// --- row <-> model mapping (DB is snake_case, app is camelCase) -------------

interface HabitRow {
  id: string
  title: string
  icon: string
  difficulty: Habit['difficulty']
  sort_order: number
  priority: boolean
  archived_at: string | null
  created_at: string
}

interface CompletionRow {
  id: string
  habit_id: string
  completed_on: string
  xp_earned: number
  completed_at: string
}

const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  title: r.title,
  icon: r.icon,
  difficulty: r.difficulty,
  sortOrder: r.sort_order,
  priority: r.priority,
  archivedAt: r.archived_at,
  createdAt: r.created_at,
})

const toCompletion = (r: CompletionRow): Completion => ({
  id: r.id,
  habitId: r.habit_id,
  completedOn: r.completed_on,
  xpEarned: r.xp_earned,
  completedAt: r.completed_at,
})

function patchToRow(p: HabitPatch): Partial<HabitRow> {
  const row: Partial<HabitRow> = {}
  if (p.title !== undefined) row.title = p.title
  if (p.icon !== undefined) row.icon = p.icon
  if (p.difficulty !== undefined) row.difficulty = p.difficulty
  if (p.sortOrder !== undefined) row.sort_order = p.sortOrder
  if (p.priority !== undefined) row.priority = p.priority
  if (p.archivedAt !== undefined) row.archived_at = p.archivedAt
  return row
}

const HABIT_COLS = 'id,title,icon,difficulty,sort_order,priority,archived_at,created_at'
const COMPLETION_COLS = 'id,habit_id,completed_on,xp_earned,completed_at'
const PAGE = 1000 // PostgREST's default max rows per request

export function createSupabaseRepo(client: SupabaseClient): Repo {
  return {
    async listHabits() {
      const { data, error } = await client.from('habits').select(HABIT_COLS).order('sort_order').order('created_at')
      if (error) throw error
      return (data as HabitRow[]).map(toHabit)
    },

    async createHabit(input: NewHabit) {
      const { data, error } = await client
        .from('habits')
        .insert({
          title: input.title,
          icon: input.icon,
          difficulty: input.difficulty,
          priority: input.priority,
          sort_order: Date.now() % 1_000_000_000,
        })
        .select(HABIT_COLS)
        .single()
      if (error) throw error
      return toHabit(data as HabitRow)
    },

    async updateHabit(id, patch) {
      const { data, error } = await client.from('habits').update(patchToRow(patch)).eq('id', id).select(HABIT_COLS).single()
      if (error) throw error
      return toHabit(data as HabitRow)
    },

    async deleteHabit(id) {
      const { error } = await client.from('habits').delete().eq('id', id)
      if (error) throw error
    },

    async reorderHabits(ids) {
      // One small update per habit; a user has a handful of habits, and RLS keeps each to its owner.
      const results = await Promise.all(ids.map((id, i) => client.from('habits').update({ sort_order: i }).eq('id', id)))
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    },

    async listCompletions() {
      // Page through results so long-time users never hit the row cap.
      const all: Completion[] = []
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await client
          .from('completions')
          .select(COMPLETION_COLS)
          .order('completed_on', { ascending: true })
          .order('id')
          .range(from, from + PAGE - 1)
        if (error) throw error
        all.push(...(data as CompletionRow[]).map(toCompletion))
        if (data.length < PAGE) return all
      }
    },

    async addCompletion(input: NewCompletion) {
      const { data, error } = await client
        .from('completions')
        .insert({ habit_id: input.habitId, completed_on: input.completedOn, xp_earned: input.xpEarned })
        .select(COMPLETION_COLS)
        .single()
      if (error) throw error
      return toCompletion(data as CompletionRow)
    },

    async removeCompletion(habitId, day) {
      const { error } = await client.from('completions').delete().eq('habit_id', habitId).eq('completed_on', day)
      if (error) throw error
    },
  }
}
