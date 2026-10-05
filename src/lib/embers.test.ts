import { describe, expect, it } from 'vitest'
import { BURST_EMBERS, burst, emberAlpha, emberColor, emberHeat, spark, stepEmber, storm, stormSize, type Ember } from './embers'

/** Small seeded PRNG, so every run gets the same embers. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/** Steps every ember until all have burnt out; returns how many frames that took. */
function burnOut(embers: Ember[], dt = 1): number {
  let frames = 0
  let alive = embers
  while (alive.length && frames < 1000) {
    alive = alive.filter((e) => stepEmber(e, dt))
    frames++
  }
  return frames
}

describe('ember burst', () => {
  it('scales the number of embers with intensity', () => {
    expect(burst(0, 0, 1, seeded(1))).toHaveLength(BURST_EMBERS)
    expect(burst(0, 0, 1.5, seeded(1))).toHaveLength(60)
    expect(burst(0, 0, 0.7, seeded(1))).toHaveLength(28)
  })

  it('fans out upwards from the button, never straight down', () => {
    const embers = burst(100, 200, 1, seeded(2))
    for (const e of embers) {
      expect([e.x, e.y]).toEqual([100, 200])
      expect(e.vy).toBeLessThan(0)
    }
    expect(embers.some((e) => e.vx < 0) && embers.some((e) => e.vx > 0)).toBe(true)
  })

  it('floats every ember upwards as it cools, then burns out', () => {
    const embers = burst(100, 500, 1, seeded(3))
    const frames = burnOut(embers)
    expect(frames).toBeLessThanOrEqual(86)
    for (const e of embers) expect(e.y).toBeLessThan(500)
  })
})

describe('ember storm', () => {
  it('sizes the wave to the screen width, within limits', () => {
    expect(stormSize(390)).toBe(78)
    expect(stormSize(200)).toBe(60)
    expect(stormSize(3000)).toBe(240)
  })

  it('starts below the bottom edge across the full width, with every third ember a pixel', () => {
    const embers = storm(1000, 800, seeded(4))
    expect(embers).toHaveLength(200)
    for (const e of embers) {
      expect(e.y).toBeGreaterThanOrEqual(800)
      expect(e.x).toBeGreaterThanOrEqual(0)
      expect(e.x).toBeLessThanOrEqual(1000)
    }
    expect(embers.filter((e) => e.pixel)).toHaveLength(67)
  })

  it('rises well up into the screen before fading, on a phone and on a desktop', () => {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const embers = storm(w, h, seeded(5))
      const lowest = embers.map((e) => {
        let top = e.y
        while (stepEmber(e)) top = Math.min(top, e.y)
        return top
      })
      // Most embers climb above the middle of the screen.
      expect(lowest.filter((y) => y < h / 2).length / lowest.length).toBeGreaterThan(0.6)
    }
  })
})

describe('ember motion and colour', () => {
  it('moves the same distance per second at 60 Hz and 120 Hz', () => {
    const at60 = burst(0, 0, 1, seeded(6))[0]
    const at120 = { ...at60, trail: [] as [number, number][] }
    for (let i = 0; i < 30; i++) stepEmber(at60, 1)
    for (let i = 0; i < 60; i++) stepEmber(at120, 0.5)
    // Within 2%: smaller steps integrate very slightly differently, which is invisible.
    expect(Math.abs(at120.x - at60.x)).toBeLessThan(Math.abs(at60.x) * 0.02)
    expect(Math.abs(at120.y - at60.y)).toBeLessThan(Math.abs(at60.y) * 0.02)
  })

  it('keeps a short tail of recent positions, shorter for the storm', () => {
    const e = burst(0, 0, 1, seeded(7))[0]
    for (let i = 0; i < 20; i++) stepEmber(e)
    expect(e.trail).toHaveLength(5)
    const s = storm(400, 800, seeded(9))[0]
    for (let i = 0; i < 20; i++) stepEmber(s)
    expect(s.trail).toHaveLength(2)
  })

  it('cools from white-hot to red, and fades out', () => {
    expect(emberColor(0)).toEqual([255, 240, 190])
    expect(emberColor(0.6)).toEqual([255, 120, 30])
    expect(emberColor(0.99)).toEqual([220, 40, 30])
    const e = burst(0, 0, 1, seeded(8))[0]
    const start = emberAlpha(e)
    e.age = e.life * 0.9
    expect(emberAlpha(e)).toBeLessThan(start)
    e.age = e.life
    expect(emberAlpha(e)).toBe(0)
  })
})

describe('sparks off a burning edge', () => {
  it('start orange rather than white-hot, and drift upwards', () => {
    const s = spark(50, 50, seeded(10))
    expect(emberColor(emberHeat(s))).toEqual([255, 120, 30])
    expect(s.vy).toBeLessThan(0)
    s.age = s.life * 0.9
    expect(emberColor(emberHeat(s))).toEqual([220, 40, 30])
  })
})
