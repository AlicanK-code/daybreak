/**
 * Pixel fire in the style of block games: a grid of "heat" values where the bottom row always burns,
 * and each step every cell's heat rises one row, drifting sideways at random and sometimes cooling.
 * That forms flickering tongues that climb and break apart. Pure and seedable, so it can be tested.
 */

/** Colours from cold (transparent) to hottest, as [r, g, b, alpha 0..255]. */
export const FIRE_PALETTE: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0, 0],
  [60, 8, 8, 110],
  [110, 14, 10, 170],
  [160, 22, 12, 210],
  [200, 36, 14, 235],
  [228, 60, 16, 255],
  [245, 92, 20, 255],
  [255, 126, 26, 255],
  [255, 160, 36, 255],
  [255, 196, 56, 255],
  [255, 208, 70, 255],
  [255, 222, 110, 255],
]

export const MAX_HEAT = FIRE_PALETTE.length - 1

/** Chance a cell cools by one step as it rises; lower means taller flames. */
const COOL_CHANCE = 0.6

export interface Fire {
  width: number
  height: number
  /** heat per cell, row by row from the top; the last row is the burning source */
  heat: Uint8Array
}

export function createFire(width: number, height: number): Fire {
  const heat = new Uint8Array(width * height)
  heat.fill(MAX_HEAT, (height - 1) * width)
  return { width, height, heat }
}

/** Advances the fire one step, in place. `rand` returns 0..1, like Math.random. */
export function stepFire(fire: Fire, rand: () => number = Math.random): void {
  const { width, height, heat } = fire
  for (let y = 1; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = y * width + x
      const value = heat[src]
      // Drift up-left, straight up or up-right, clamped to the row.
      const dx = Math.min(width - 1, Math.max(0, x + Math.floor(rand() * 3) - 1))
      const dst = (y - 1) * width + dx
      heat[dst] = value === 0 ? 0 : value - (rand() < COOL_CHANCE ? 1 : 0)
    }
  }
}

/** Writes the fire's colours into an RGBA pixel buffer (one pixel per cell), e.g. ImageData.data. */
export function paintFire(fire: Fire, pixels: Uint8ClampedArray): void {
  for (let i = 0; i < fire.heat.length; i++) {
    const [r, g, b, a] = FIRE_PALETTE[fire.heat[i]]
    const p = i * 4
    pixels[p] = r
    pixels[p + 1] = g
    pixels[p + 2] = b
    pixels[p + 3] = a
  }
}

/** Small seeded random number generator (mulberry32), for repeatable fire in tests. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A spark flying up out of the fire: one fire pixel that rises, drifts and cools. */
export interface Spark {
  x: number
  y: number
  heat: number
}

/** Chance per step that a new spark breaks off the flames, per 100 columns of fire. */
const SPARK_RATE = 0.6
/** Chance per step that a spark cools by one heat level as it rises. */
const SPARK_COOL = 0.18

/**
 * Advances the sparks one step, in place: sparks rise a cell (sometimes drifting sideways) and cool,
 * burnt-out or escaped ones are dropped, and new ones break off the tips of the flames.
 */
export function stepSparks(fire: Fire, sparks: Spark[], rand: () => number = Math.random): void {
  const { width, heat } = fire
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]
    s.y -= 1
    if (rand() < 0.3) s.x += rand() < 0.5 ? -1 : 1
    if (rand() < SPARK_COOL) s.heat -= 1
    if (s.heat <= 0 || s.y < 0 || s.x < 0 || s.x >= width) sparks.splice(i, 1)
  }
  let births = (width / 100) * SPARK_RATE
  while (births > 0) {
    if (rand() < births) {
      // Break off just above the highest burning cell in a random column.
      const x = Math.floor(rand() * width)
      for (let y = 0; y < fire.height - 1; y++) {
        const h = heat[y * width + x]
        if (h >= 3) {
          if (y > 0) sparks.push({ x, y: y - 1, heat: Math.min(MAX_HEAT, h + 2) })
          break
        }
      }
    }
    births -= 1
  }
}

/** Draws the sparks over the fire's pixels (after paintFire). */
export function paintSparks(fire: Fire, sparks: readonly Spark[], pixels: Uint8ClampedArray): void {
  for (const s of sparks) {
    const [r, g, b, a] = FIRE_PALETTE[Math.max(0, Math.min(MAX_HEAT, s.heat))]
    const p = (s.y * fire.width + s.x) * 4
    pixels[p] = r
    pixels[p + 1] = g
    pixels[p + 2] = b
    pixels[p + 3] = a
  }
}
