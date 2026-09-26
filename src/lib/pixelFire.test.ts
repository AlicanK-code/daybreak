import { describe, expect, it } from 'vitest'
import { FIRE_PALETTE, MAX_HEAT, createFire, paintFire, seededRandom, stepFire } from './pixelFire'

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
