/**
 * A notification burning away like a scroll held over a flame: a ragged, glowing edge climbs from
 * the bottom to the top, scorching the paper ahead of it. This is the pure model, seedable so it
 * can be tested; `BurningToast` draws it.
 */

import type { Rand } from './embers'

/** How long a burn takes: slow enough to watch the edge climb. */
export const BURN_MS = 1800

/** A notification's whole life, from appearing to burnt away (the burn is the last BURN_MS of it). */
export const NOTIFICATION_MS = 4000
/** Size of one burn cell in CSS pixels: the pattern is worked out on this coarser grid. */
export const BURN_CELL = 2
/** Width of the glowing edge, and of the scorch ahead of it, as a share of the burn's progress. */
export const EDGE = 0.04
export const SCORCH = 0.14

/** Smooth random noise from a coarse grid of random values, blended between grid points. */
function valueNoise(cols: number, rows: number, scale: number, rand: Rand): (x: number, y: number) => number {
  const gw = Math.ceil(cols / scale) + 2
  const gh = Math.ceil(rows / scale) + 2
  const grid = Array.from({ length: gw * gh }, () => rand())
  const at = (i: number, j: number) => grid[j * gw + i]
  const ease = (t: number) => t * t * (3 - 2 * t)
  return (x, y) => {
    const gx = x / scale
    const gy = y / scale
    const x0 = Math.floor(gx)
    const y0 = Math.floor(gy)
    const fx = ease(gx - x0)
    const fy = ease(gy - y0)
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx
    return top + (bottom - top) * fy
  }
}

/**
 * When each cell burns, from 0 (first) to 1 (last), row by row: mostly bottom to top, with noise so
 * the edge is ragged and flames lick ahead in places.
 */
export function burnOrder(cols: number, rows: number, rand: Rand = Math.random): Float32Array {
  const coarse = valueNoise(cols, rows, 6, rand)
  const fine = valueNoise(cols, rows, 2.5, rand)
  const order = new Float32Array(cols * rows)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const fromBottom = rows > 1 ? 1 - y / (rows - 1) : 0
      order[y * cols + x] = fromBottom * 0.75 + (coarse(x, y) * 0.6 + fine(x, y) * 0.4) * 0.25
    }
  }
  // Stretch to exactly 0..1, so every burn starts and finishes on time.
  let lo = Infinity
  let hi = -Infinity
  for (const v of order) {
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  const span = hi - lo || 1
  for (let i = 0; i < order.length; i++) order[i] = (order[i] - lo) / span
  return order
}

/** Where the burning edge is at a point in the burn (0 to 1): it starts just below and ends past the top. */
export function burnFront(progress: number): number {
  return -EDGE + progress * (1 + EDGE + SCORCH)
}

export type BurnState = { kind: 'gone' } | { kind: 'edge'; heat: number } | { kind: 'scorch'; amount: number } | { kind: 'paper' }

/**
 * What a cell looks like with the edge at `front`: already gone, part of the glowing edge (heat 1
 * at the very rim), scorched ahead of it (amount 1 next to the edge), or untouched paper.
 */
export function burnState(order: number, front: number): BurnState {
  const gap = order - front
  if (gap < 0) return { kind: 'gone' }
  if (gap < EDGE) return { kind: 'edge', heat: 1 - gap / EDGE }
  if (gap < EDGE + SCORCH) return { kind: 'scorch', amount: 1 - (gap - EDGE) / SCORCH }
  return { kind: 'paper' }
}

/**
 * The glowing edge's colour: aggressive orange at the rim where it's hottest, deepening to blood
 * red behind it. Never yellow or white.
 */
export function edgeColor(heat: number): [number, number, number] {
  const h = Math.min(Math.max(heat, 0), 1)
  return [Math.round(200 + 55 * h), Math.round(20 + 90 * h), Math.round(10 + 16 * h)]
}

/** Scorch drawn over the paper ahead of the edge: dark red-brown, glowing redder close to the edge. */
export function scorchColor(amount: number): [number, number, number, number] {
  const a = Math.min(Math.max(amount, 0), 1)
  return [Math.round(60 + 90 * a * a), Math.round(8 + 6 * a), 6, 0.35 + 0.55 * a]
}
