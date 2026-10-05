/**
 * Ember celebrations: sparks that burst out of a button and float upwards (heat rises), and a wave
 * of embers rising from the bottom of the screen for big moments. This is the pure particle model,
 * seedable so it can be tested; `celebrate.ts` draws it.
 */

export interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  /** frames lived, and frames it lives for */
  age: number
  life: number
  /** radius for round embers, side length for pixel ones (px) */
  size: number
  /** square, like the pixel-fire background, rather than a round glowing spark */
  pixel: boolean
  /** phase for the sideways sway of rising embers; 0 for none */
  sway: number
  /** recent positions, newest last, for the short glowing tail, and how many to keep */
  trail: [number, number][]
  tail: number
  /** how far through cooling it starts (0 = white-hot, 0.5 = already orange) */
  heat0: number
  /** upward pull per frame (negative is up) and how much speed is kept each frame */
  lift: number
  drag: number
}

export type Rand = () => number

const between = (rand: Rand, a: number, b: number) => a + rand() * (b - a)

/** Embers per unit of intensity in a burst (an easy habit is about 0.7, a hard one 1.5). */
export const BURST_EMBERS = 40

/**
 * A burst from a point, like striking a flint: sparks fly up and out in a fan (never straight
 * down), slow down, then drift upwards as they cool.
 */
export function burst(x: number, y: number, intensity = 1, rand: Rand = Math.random): Ember[] {
  return Array.from({ length: Math.round(BURST_EMBERS * intensity) }, () => {
    const angle = between(rand, -Math.PI * 0.95, -Math.PI * 0.05)
    const speed = between(rand, 2, 6.5)
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life: between(rand, 45, 85),
      size: between(rand, 1.4, 3),
      pixel: false,
      sway: 0,
      trail: [],
      tail: 5,
      heat0: 0,
      lift: -0.03,
      drag: 0.965,
    }
  })
}

/** Embers in a storm: one per 5 px of screen width, up to a cap so big screens stay smooth. */
export function stormSize(width: number): number {
  return Math.min(240, Math.max(60, Math.round(width / 5)))
}

/**
 * A wave of embers rising from below the bottom edge across the whole screen, swaying as they go,
 * as if the background fire flares up. Every third one is a square pixel ember. Speeds scale with
 * the screen height, so they climb a similar share of it on a phone and on a desktop.
 */
export function storm(width: number, height: number, rand: Rand = Math.random): Ember[] {
  return Array.from({ length: stormSize(width) }, (_, i) => {
    const pixel = i % 3 === 0
    return {
      x: between(rand, 0, width),
      y: height + between(rand, 0, height * 0.3),
      vx: between(rand, -0.6, 0.6),
      vy: -between(rand, 0.006, 0.012) * height,
      age: 0,
      life: between(rand, 80, 140),
      size: pixel ? 4 : between(rand, 1.4, 3.2),
      pixel,
      sway: between(rand, 1, 7),
      // Shorter tails than a burst: storm embers rise fast, and long tails read as streaks.
      trail: [],
      tail: 2,
      heat0: 0,
      lift: -0.01,
      drag: 0.995,
    }
  })
}

/**
 * A spark flicking off a burning edge (a notification burning away): small, short-lived and already
 * orange, cooling to red as it drifts up.
 */
export function spark(x: number, y: number, rand: Rand = Math.random): Ember {
  return {
    x,
    y,
    vx: between(rand, -0.6, 0.6),
    vy: -between(rand, 0.4, 1.8),
    age: 0,
    life: between(rand, 30, 60),
    size: between(rand, 1, 1.8),
    pixel: false,
    sway: 0,
    trail: [],
    tail: 3,
    heat0: 0.5,
    lift: -0.02,
    drag: 0.98,
  }
}

/** How far through cooling an ember is, from 0 (just struck) to 1 (gone). */
export function emberHeat(e: Ember): number {
  return Math.min(e.heat0 + (1 - e.heat0) * (e.age / e.life), 1)
}

/**
 * Moves an ember on by `dt` frames (1 = one frame at 60 fps, so it looks the same at 120 Hz).
 * Returns false once it has burnt out.
 */
export function stepEmber(e: Ember, dt = 1): boolean {
  e.age += dt
  if (e.age >= e.life) return false
  const keep = Math.pow(e.drag, dt)
  e.vx *= keep
  e.vy = e.vy * keep + e.lift * dt
  if (e.sway) e.vx += Math.sin((e.age + e.sway * 10) / 9) * 0.05 * dt
  e.trail.push([e.x, e.y])
  if (e.trail.length > e.tail) e.trail.shift()
  e.x += e.vx * dt
  e.y += e.vy * dt
  return true
}

/** Colour as an ember cools, from 0 (just struck) to 1 (gone): white-hot, gold, orange, then red. */
export function emberColor(t: number): [number, number, number] {
  if (t < 0.25) return [255, 240, 190]
  if (t < 0.5) return [255, 190, 70]
  if (t < 0.75) return [255, 120, 30]
  return [220, 40, 30]
}

/** How opaque an ember is: fading as it cools, with a slight flicker. */
export function emberAlpha(e: Ember): number {
  const t = Math.min(e.age / e.life, 1)
  return Math.max(0, (1 - t) * (0.75 + 0.25 * Math.sin(e.age * 0.8)))
}
