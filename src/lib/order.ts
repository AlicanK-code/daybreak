/** Helpers for the manual order of habits (their sortOrder). */

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
