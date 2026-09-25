/** Layout for the small streaks of flame that shoot off the filled part of the Sun Breathing XP bar. */

export interface FlameStreak {
  /** which edge of the fill it shoots off: up from the top, or down from the bottom */
  edge: 'top' | 'bottom'
  /** where along the fill it starts, 0..100 (%) */
  left: number
  /** which streak shape to draw (index into the component's shape list) */
  shape: number
  /** how far it flies, in px */
  dx: number
  dy: number
  /** direction of travel in degrees (0 = right, 90 = down), so the streak points where it flies */
  dir: number
  /** streak length in px */
  size: number
  duration: number
  delay: number
}

export const STREAK_SHAPES = 4
const MAX_STREAKS = 16
// Keep streaks clear of the rounded left end and the sun disc at the tip.
const START = 4
const SPAN = 84

/** Deterministic 0..1 jitter (golden-ratio sequence), stable across renders. */
const jitter = (i: number) => (i * 0.618034) % 1

/**
 * More streaks as the bar fills, alternating between the top and bottom edges. Each flies outward
 * from its edge, mostly swept back (away from the tip) but spread up to ±50° so they scatter in
 * different directions, with varied shapes, lengths and timing.
 */
export function flameStreaks(progress: number): FlameStreak[] {
  const p = Math.min(Math.max(progress, 0), 1)
  const n = Math.max(3, Math.round(p * MAX_STREAKS))
  return Array.from({ length: n }, (_, i) => {
    const edge = i % 2 === 0 ? 'top' : 'bottom'
    // Swept back and outward from the edge, then swung by up to ±50°.
    const [ux, uy] = edge === 'top' ? [-0.45, -0.9] : [-0.45, 0.9]
    const angle = ((jitter(i + 23) - 0.5) * 100 * Math.PI) / 180
    const dirX = ux * Math.cos(angle) - uy * Math.sin(angle)
    const dirY = ux * Math.sin(angle) + uy * Math.cos(angle)
    const dist = 10 + 12 * jitter(i + 29)
    return {
      edge,
      left: START + (SPAN * (i + 0.5)) / n,
      shape: (i * 3) % STREAK_SHAPES,
      dx: Math.round(dirX * dist),
      dy: Math.round(dirY * dist),
      dir: Math.round((Math.atan2(dirY, dirX) * 180) / Math.PI),
      size: Math.round(8 + 6 * jitter(i + 37)),
      duration: 1.4 + 1 * jitter(i + 41),
      delay: -3 * jitter(i + 43),
    }
  })
}
