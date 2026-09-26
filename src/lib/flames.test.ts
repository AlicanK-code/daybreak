import { describe, expect, it } from 'vitest'
import { FLECK_SPRITES, STREAK_SHAPES, flameStreaks, risingFlecks } from './flames'

describe('flameStreaks', () => {
  const full = flameStreaks(1)

  it('always shows a few streaks, even when the bar is nearly empty', () => {
    expect(flameStreaks(0)).toHaveLength(3)
  })

  it('adds streaks as the bar fills', () => {
    expect(flameStreaks(0.9).length).toBeGreaterThan(flameStreaks(0.2).length)
    expect(full).toHaveLength(16)
  })

  it('clamps out-of-range progress', () => {
    expect(flameStreaks(-1)).toEqual(flameStreaks(0))
    expect(flameStreaks(2)).toEqual(flameStreaks(1))
  })

  it('shoots off both edges, keeping clear of the rounded end and the sun disc', () => {
    expect(full.some((s) => s.edge === 'top')).toBe(true)
    expect(full.some((s) => s.edge === 'bottom')).toBe(true)
    for (const s of full) {
      expect(s.left).toBeGreaterThan(4)
      expect(s.left).toBeLessThan(88)
    }
  })

  it('flies outward from its edge', () => {
    for (const s of full) {
      if (s.edge === 'top') expect(s.dy).toBeLessThan(0)
      else expect(s.dy).toBeGreaterThan(0)
    }
  })

  it('scatters in different directions, mostly swept back', () => {
    const dirs = full.map((s) => s.dir)
    expect(Math.max(...dirs) - Math.min(...dirs)).toBeGreaterThanOrEqual(90)
    expect(full.some((s) => s.dx > 0)).toBe(true)
    expect(full.filter((s) => s.dx < 0).length).toBeGreaterThan(full.length / 2)
  })

  it('points each streak along the direction it flies', () => {
    for (const s of full) {
      const rad = (s.dir * Math.PI) / 180
      // Rounding dx/dy to whole pixels leaves a little slack.
      expect(Math.cos(rad) * s.dx + Math.sin(rad) * s.dy).toBeGreaterThan(Math.hypot(s.dx, s.dy) * 0.95)
    }
  })

  it('moves every streak a visible distance', () => {
    for (const s of full) expect(Math.hypot(s.dx, s.dy)).toBeGreaterThanOrEqual(8)
  })

  it('uses every streak shape and a range of lengths', () => {
    expect(new Set(full.map((s) => s.shape)).size).toBe(STREAK_SHAPES)
    const sizes = full.map((s) => s.size)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeGreaterThanOrEqual(3)
  })

  it('is deterministic, so streaks do not jump between renders', () => {
    expect(flameStreaks(0.42)).toEqual(flameStreaks(0.42))
  })
})

describe('risingFlecks', () => {
  const flecks = risingFlecks()

  it('spreads fragments across the screen', () => {
    const lefts = flecks.map((f) => f.left)
    expect(Math.min(...lefts)).toBeLessThan(20)
    expect(Math.max(...lefts)).toBeGreaterThan(80)
  })

  it('varies pixel size, drift, sprite and tone', () => {
    const sizes = flecks.map((f) => f.size)
    for (const s of sizes) {
      expect(s).toBeGreaterThanOrEqual(4)
      expect(s).toBeLessThanOrEqual(8)
    }
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeGreaterThanOrEqual(3)
    expect(new Set(flecks.map((f) => f.sprite)).size).toBe(FLECK_SPRITES)
    expect(flecks.some((f) => f.drift < 0)).toBe(true)
    expect(flecks.some((f) => f.drift > 0)).toBe(true)
    expect(new Set(flecks.map((f) => f.tone))).toEqual(new Set([0, 1, 2]))
  })

  it('drifts slowly and is already under way on load', () => {
    for (const f of flecks) {
      expect(f.duration).toBeGreaterThanOrEqual(7)
      expect(f.delay).toBeLessThanOrEqual(0)
    }
  })

  it('is deterministic', () => {
    expect(risingFlecks()).toEqual(risingFlecks())
  })
})
