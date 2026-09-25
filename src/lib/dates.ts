/**
 * Day keys are local-calendar dates formatted as YYYY-MM-DD.
 * All arithmetic is done at noon UTC to stay clear of DST edge cases.
 */

export function toDayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function keyToUtcNoon(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d, 12)
}

export function addDays(key: string, n: number): string {
  const t = new Date(keyToUtcNoon(key) + n * 86_400_000)
  return t.toISOString().slice(0, 10)
}

/** Whole days from a to b (b - a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((keyToUtcNoon(b) - keyToUtcNoon(a)) / 86_400_000)
}

/** The last `n` day keys ending at `end`, oldest first. */
export function lastNDays(n: number, end: string): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1))
}

/** Day of week for a key, 0 = Monday … 6 = Sunday. */
export function weekday(key: string): number {
  return (new Date(keyToUtcNoon(key)).getUTCDay() + 6) % 7
}

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  return new Date(keyToUtcNoon(key)).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' })
}
