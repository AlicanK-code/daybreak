/** Helpers for the order habits are listed in. */

import type { Difficulty } from './types'

/** Returns a copy of `items` with the item at `from` moved to `to`. Out-of-range moves are clamped. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items]
  if (from < 0 || from >= next.length) return next
  const target = Math.min(Math.max(to, 0), next.length - 1)
  const [item] = next.splice(from, 1)
  next.splice(target, 0, item)
  return next
}

/**
 * Gives the listed ids sortOrder 0, 1, 2… in the given order and sorts by it. Items not listed
 * (e.g. archived habits) keep their sortOrder and go after the listed ones.
 */
export function applyOrder<T extends { id: string; sortOrder: number }>(items: readonly T[], ids: readonly string[]): T[] {
  const rank = new Map(ids.map((id, i) => [id, i]))
  const listed = items.filter((it) => rank.has(it.id)).map((it) => ({ ...it, sortOrder: rank.get(it.id)! }))
  const rest = items.filter((it) => !rank.has(it.id))
  return [...listed.sort((a, b) => a.sortOrder - b.sortOrder), ...rest]
}

/**
 * Puts a reordered subset back into the full order: the subset's items fill the places they held,
 * in their new order, and everything else stays where it was. Used when only some habits are shown
 * (those due today) but the saved order covers them all.
 */
export function mergeOrder<T>(full: readonly T[], subset: readonly T[]): T[] {
  const inSubset = new Set(subset)
  const next = subset.filter((x) => full.includes(x))
  let i = 0
  return [...full.map((x) => (inSubset.has(x) ? next[i++] : x)), ...subset.filter((x) => !full.includes(x))]
}

type Orderable = { id: string; title: string; difficulty: Difficulty; priority: boolean; sortOrder: number }

const DIFFICULTY_RANK: Record<Difficulty, number> = { hard: 0, medium: 1, easy: 2 }
// Case-insensitive and number-aware, so "habit 2" comes before "Habit 10".
const byTitle = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

/**
 * The order habits are listed in: priority habits first, hardest first and then A–Z by title;
 * then everything else in the player's own drag-and-drop order. Habits in `done` (finished today)
 * sink below the unfinished ones, keeping the same order among themselves.
 */
export function orderHabits<T extends Orderable>(habits: readonly T[], done: ReadonlySet<string> = new Set()): T[] {
  const todo = habits.filter((h) => !done.has(h.id))
  const finished = habits.filter((h) => done.has(h.id))
  return [...byPriorityThenOwnOrder(todo), ...byPriorityThenOwnOrder(finished)]
}

function byPriorityThenOwnOrder<T extends Orderable>(habits: readonly T[]): T[] {
  const priority = habits
    .filter((h) => h.priority)
    .sort(
      (a, b) =>
        DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || byTitle.compare(a.title, b.title) || a.id.localeCompare(b.id),
    )
  const rest = habits.filter((h) => !h.priority).sort((a, b) => a.sortOrder - b.sortOrder)
  return [...priority, ...rest]
}
