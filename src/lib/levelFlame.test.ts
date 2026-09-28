import { describe, expect, it } from 'vitest'
import { RANK_LEVELS } from '../game/xp'
import { FLAME_BASE_PX, FLAME_GROWTH_PX, FLAME_MAX_LEVEL, flameStages, levelFlame, stageIndexFor } from './levelFlame'

const rgb = (css: string) => css.match(/\d+/g)!.map(Number)

describe('levelFlame', () => {
  it('starts small at level 1', () => {
    expect(levelFlame(1).height).toBe(FLAME_BASE_PX)
    expect(levelFlame(1).heat).toBe(0)
  })

  it('grows by the same amount with every level', () => {
    for (let lv = 1; lv < FLAME_MAX_LEVEL; lv++) {
      expect(levelFlame(lv + 1).height - levelFlame(lv).height).toBe(FLAME_GROWTH_PX)
    }
  })

  it('stops growing at the max level, so it never outgrows the card', () => {
    const max = levelFlame(FLAME_MAX_LEVEL)
    expect(max.height).toBe(FLAME_BASE_PX + FLAME_GROWTH_PX * (FLAME_MAX_LEVEL - 1))
    expect(levelFlame(FLAME_MAX_LEVEL + 40)).toEqual(max)
    expect(max.heat).toBe(1)
  })

  it('keeps the drawing in proportion', () => {
    for (const lv of [1, 9, 25]) {
      const f = levelFlame(lv)
      expect(f.width / f.height).toBeCloseTo(100 / 120, 2)
    }
  })

  it('treats odd input as the nearest sensible level', () => {
    expect(levelFlame(0)).toEqual(levelFlame(1))
    expect(levelFlame(-3)).toEqual(levelFlame(1))
    expect(levelFlame(9.7)).toEqual(levelFlame(9))
  })

  it('gets fiercer as the level rises: redder, stronger glow, faster flicker', () => {
    let prev = levelFlame(1)
    for (let lv = 2; lv <= FLAME_MAX_LEVEL; lv++) {
      const f = levelFlame(lv)
      const [, gPrev] = rgb(prev.colors.outer)
      const [, g] = rgb(f.colors.outer)
      expect(g).toBeLessThanOrEqual(gPrev) // less green = deeper red
      expect(f.heat).toBeGreaterThan(prev.heat)
      expect(f.flicker).toBeLessThan(prev.flicker)
      prev = f
    }
    const glowRadius = (lv: number) => Number(levelFlame(lv).glow.match(/0 0 ([\d.]+)px/)![1])
    expect(glowRadius(FLAME_MAX_LEVEL)).toBeGreaterThan(glowRadius(1))
  })

  it('goes from warm orange at level 1 to deep crimson at the max level', () => {
    expect(rgb(levelFlame(1).colors.outer)).toEqual([255, 140, 40])
    expect(rgb(levelFlame(FLAME_MAX_LEVEL).colors.outer)).toEqual([196, 0, 26])
  })
})

describe('flameStages', () => {
  const stages = flameStages()

  it('starts a stage at each rank the flame passes through, then full blaze', () => {
    const froms = stages.map((s) => s.from)
    expect(froms).toEqual([...RANK_LEVELS.filter((lv) => lv < FLAME_MAX_LEVEL), FLAME_MAX_LEVEL])
    expect(froms[0]).toBe(1)
    expect(froms.at(-1)).toBe(FLAME_MAX_LEVEL)
  })

  it('covers every level with no gaps or overlaps, the last stage open-ended', () => {
    for (let i = 0; i < stages.length - 1; i++) expect(stages[i].to).toBe(stages[i + 1].from - 1)
    expect(stages.at(-1)!.to).toBeNull()
  })

  it('shows a clear change between each stage', () => {
    for (let i = 1; i < stages.length; i++) {
      expect(levelFlame(stages[i].from).height).toBeGreaterThan(levelFlame(stages[i - 1].from).height)
    }
  })

  it('finds the stage a level falls in', () => {
    expect(stageIndexFor(1)).toBe(0)
    const knight = stages.findIndex((s) => s.from === 8)
    expect(stageIndexFor(9)).toBe(knight)
    expect(stageIndexFor(FLAME_MAX_LEVEL)).toBe(stages.length - 1)
    expect(stageIndexFor(60)).toBe(stages.length - 1)
  })
})
