import { describe, expect, it } from 'vitest'
import { FIRE_PALETTE, MAX_HEAT, createFire, paintFire, paintSparks, seededRandom, stepFire, stepSparks, type Spark } from './pixelFire'

const W = 40
const H = 30

/** A fire run for `steps` steps with a fixed seed. */
function burn(steps: number, seed = 1) {
  const fire = createFire(W, H)
  const rand = seededRandom(seed)
  for (let i = 0; i < steps; i++) stepFire(fire, rand)
  return fire
}

const row = (fire: ReturnType<typeof createFire>, y: number) => fire.heat.slice(y * W, (y + 1) * W)
const hottest = (values: Uint8Array) => Math.max(...values)

describe('pixel fire', () => {
  it('starts with only the bottom row burning, at full heat', () => {
    const fire = createFire(W, H)
    expect([...row(fire, H - 1)].every((v) => v === MAX_HEAT)).toBe(true)
    expect(hottest(fire.heat.slice(0, (H - 1) * W))).toBe(0)
  })

  it('keeps the bottom row burning as it runs', () => {
    expect([...row(burn(60), H - 1)].every((v) => v === MAX_HEAT)).toBe(true)
  })

  it('rises into tongues of flame over the burning row', () => {
    const fire = burn(60)
    expect(hottest(row(fire, H - 6))).toBeGreaterThan(0)
    // Tongues, not a flat wall: partway up, some cells burn and some don't.
    const mid = [...row(fire, Math.floor(H / 2))]
    expect(mid.some((v) => v > 0) && mid.some((v) => v === 0)).toBe(true)
  })

  it('cools as it rises, so the top of the grid stays clear', () => {
    const fire = burn(60)
    expect(hottest(row(fire, 0))).toBe(0)
    const avg = (y: number) => row(fire, y).reduce((s, v) => s + v, 0) / W
    expect(avg(H - 3)).toBeGreaterThan(avg(H - 12))
  })

  it('never leaves the heat range', () => {
    for (const v of burn(100).heat) expect(v).toBeLessThanOrEqual(MAX_HEAT)
  })

  it('is repeatable for a given seed, and flickers between seeds', () => {
    expect(burn(40, 7).heat).toEqual(burn(40, 7).heat)
    expect(burn(40, 7).heat).not.toEqual(burn(40, 8).heat)
  })

  it('paints each cell with its palette colour', () => {
    const fire = burn(30)
    const pixels = new Uint8ClampedArray(W * H * 4)
    paintFire(fire, pixels)
    for (const i of [0, W * (H - 1), W * H - 1, Math.floor((W * H) / 2)]) {
      expect([...pixels.slice(i * 4, i * 4 + 4)]).toEqual([...FIRE_PALETTE[fire.heat[i]]])
    }
  })

  it('runs from transparent when cold to opaque when hot', () => {
    expect(FIRE_PALETTE[0][3]).toBe(0)
    expect(FIRE_PALETTE[MAX_HEAT][3]).toBe(255)
  })
})

describe('sparks', () => {
  /** A lit fire, then `steps` more steps of fire and sparks together. */
  function run(steps: number, seed = 3, height = H) {
    const fire = createFire(W, height)
    const rand = seededRandom(seed)
    for (let i = 0; i < 40; i++) stepFire(fire, rand)
    const sparks: Spark[] = []
    const seen: Spark[][] = []
    for (let i = 0; i < steps; i++) {
      stepFire(fire, rand)
      stepSparks(fire, sparks, rand)
      seen.push(sparks.map((s) => ({ ...s })))
    }
    return { fire, sparks, seen }
  }

  it('break off the flames over time', () => {
    expect(run(60).seen.some((s) => s.length > 0)).toBe(true)
  })

  it('stay inside the grid with a valid heat', () => {
    for (const frame of run(120).seen) {
      for (const s of frame) {
        expect(s.x).toBeGreaterThanOrEqual(0)
        expect(s.x).toBeLessThan(W)
        expect(s.y).toBeGreaterThanOrEqual(0)
        expect(s.y).toBeLessThan(H)
        expect(s.heat).toBeGreaterThan(0)
        expect(s.heat).toBeLessThanOrEqual(MAX_HEAT)
      }
    }
  })

  it('rise above the flames into the empty sky', () => {
    const { fire, seen } = run(200, 5, 60)
    // Highest burning row: nothing hotter than 0 above it in the fire itself.
    let flameTop = fire.height
    for (let y = fire.height - 1; y >= 0; y--) if (fire.heat.slice(y * W, (y + 1) * W).some((v) => v > 0)) flameTop = y
    expect(seen.flat().some((s) => s.y < flameTop)).toBe(true)
  })

  it('are drawn on top of the fire in their own colour', () => {
    const fire = createFire(W, H)
    const pixels = new Uint8ClampedArray(W * H * 4)
    paintFire(fire, pixels)
    paintSparks(fire, [{ x: 4, y: 2, heat: 7 }], pixels)
    const p = (2 * W + 4) * 4
    expect([...pixels.slice(p, p + 4)]).toEqual([...FIRE_PALETTE[7]])
  })

  it('are repeatable for a given seed', () => {
    expect(run(80, 9).sparks).toEqual(run(80, 9).sparks)
  })
})
