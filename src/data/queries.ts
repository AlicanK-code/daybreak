import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applyOrder } from '../lib/order'
import type { Completion, Habit, HabitPatch, NewCompletion, NewHabit } from '../lib/types'
import { useRepo } from './RepoContext'

export const keys = {
  habits: ['habits'] as const,
  completions: ['completions'] as const,
}

export function useHabits() {
  const repo = useRepo()
  return useQuery({ queryKey: keys.habits, queryFn: () => repo.listHabits() })
}

export function useCompletions() {
  const repo = useRepo()
  return useQuery({ queryKey: keys.completions, queryFn: () => repo.listCompletions() })
}

export function useCreateHabit() {
  const repo = useRepo()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (h: NewHabit) => repo.createHabit(h),
    onSuccess: (habit) => qc.setQueryData<Habit[]>(keys.habits, (old = []) => [...old, habit]),
  })
}

export function useUpdateHabit() {
  const repo = useRepo()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: HabitPatch }) => repo.updateHabit(id, patch),
    onSuccess: (habit) => qc.setQueryData<Habit[]>(keys.habits, (old = []) => old.map((h) => (h.id === habit.id ? habit : h))),
  })
}

/** Reordering is optimistic too: the list settles where it was dropped, and rolls back on error. */
export function useReorderHabits() {
  const repo = useRepo()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => repo.reorderHabits(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: keys.habits })
      const previous = qc.getQueryData<Habit[]>(keys.habits)
      qc.setQueryData<Habit[]>(keys.habits, (old = []) => applyOrder(old, ids))
      return { previous }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.habits, ctx.previous)
    },
  })
}

export function useDeleteHabit() {
  const repo = useRepo()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteHabit(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Habit[]>(keys.habits, (old = []) => old.filter((h) => h.id !== id))
      qc.setQueryData<Completion[]>(keys.completions, (old = []) => old.filter((c) => c.habitId !== id))
    },
  })
}

/**
 * Completing/uncompleting is optimistic: the UI (and the celebration) react
 * instantly, and we roll back if the server rejects the write.
 */
export function useToggleCompletion() {
  const repo = useRepo()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: { type: 'add'; input: NewCompletion } | { type: 'remove'; habitId: string; day: string }) => {
      if (a.type === 'add') return repo.addCompletion(a.input)
      await repo.removeCompletion(a.habitId, a.day)
      return null
    },
    onMutate: async (a) => {
      await qc.cancelQueries({ queryKey: keys.completions })
      const previous = qc.getQueryData<Completion[]>(keys.completions)
      qc.setQueryData<Completion[]>(keys.completions, (old = []) =>
        a.type === 'add'
          ? [...old, { ...a.input, id: `optimistic-${a.input.habitId}`, completedAt: new Date().toISOString() }]
          : old.filter((c) => !(c.habitId === a.habitId && c.completedOn === a.day)),
      )
      return { previous }
    },
    onError: (_err, _a, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.completions, ctx.previous)
    },
    onSuccess: (saved, a) => {
      if (a.type === 'add' && saved) {
        qc.setQueryData<Completion[]>(keys.completions, (old = []) =>
          old.map((c) => (c.id === `optimistic-${a.input.habitId}` ? saved : c)),
        )
      }
    },
  })
}
