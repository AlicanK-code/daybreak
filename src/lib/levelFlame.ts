/**
 * The flame-shaped level badge: it grows by the same amount with every level, and its colours
 * shift from warm orange and gold towards a fierce crimson with a stronger glow and a faster
 * flicker. Both stop changing at FLAME_MAX_LEVEL, so the badge never crowds out the card.
 */

import { RANK_LEVELS } from '../game/xp'

/** Badge height at level 1 (about the size of the old circular badge), and growth per level, in px. */
export const FLAME_BASE_PX = 60
export const FLAME_GROWTH_PX = 1
/** Level at which the flame reaches its full size and fiercest colours. */
export const FLAME_MAX_LEVEL = 25
/** Width as a share of height, matching the flame drawing's proportions. */
const ASPECT = 100 / 120

export interface LevelFlameLook {
  height: number
  width: number
  /** 0 at level 1 → 1 at FLAME_MAX_LEVEL and beyond */
  heat: number
  /** fill colours for each layer, from the outside in */
  colors: { outer: string; mid: string; inner: string; core: string }
  /** CSS filter for the glow around the flame */
  glow: string
  /** seconds per flicker cycle; faster as the flame gets fiercer */
  flicker: number
}

// Calm (level 1) → fierce (FLAME_MAX_LEVEL) colours for each layer, as [r, g, b].
const CALM = { outer: [255, 140, 40], mid: [255, 196, 74], inner: [255, 236, 150], core: [255, 255, 255] } as const
const FIERCE = { outer: [196, 0, 26], mid: [255, 64, 16], inner: [255, 196, 0], core: [255, 248, 220] } as const

function mix(a: readonly number[], b: readonly number[], t: number): string {
  const [r, g, bl] = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `rgb(${r} ${g} ${bl})`
}

export function levelFlame(level: number): LevelFlameLook {
  const capped = Math.min(Math.max(Math.floor(level), 1), FLAME_MAX_LEVEL)
  const heat = (capped - 1) / (FLAME_MAX_LEVEL - 1)
  const height = FLAME_BASE_PX + FLAME_GROWTH_PX * (capped - 1)
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    height,
    width: round(height * ASPECT),
    heat: round(heat),
    colors: {
      outer: mix(CALM.outer, FIERCE.outer, heat),
      mid: mix(CALM.mid, FIERCE.mid, heat),
      inner: mix(CALM.inner, FIERCE.inner, heat),
      core: mix(CALM.core, FIERCE.core, heat),
    },
    glow: `drop-shadow(0 0 ${round(3 + 9 * heat)}px rgb(255 ${Math.round(150 - 110 * heat)} 30 / ${round(0.35 + 0.5 * heat)}))`,
    flicker: round(1.8 - 0.9 * heat),
  }
}

export interface FlameStage {
  /** first level of the stage */
  from: number
  /** last level of the stage, or null for the final, open-ended stage */
  to: number | null
}

/**
 * The flame stages worth showing: one per rank title the flame passes through (the points where
 * the look changes most noticeably), ending with full blaze at FLAME_MAX_LEVEL, after which the
 * flame stops changing.
 */
export function flameStages(): FlameStage[] {
  const starts = [...RANK_LEVELS.filter((lv) => lv < FLAME_MAX_LEVEL), FLAME_MAX_LEVEL]
  return starts.map((from, i) => ({ from, to: i + 1 < starts.length ? starts[i + 1] - 1 : null }))
}

/** Index of the stage a level falls in. */
export function stageIndexFor(level: number, stages: FlameStage[] = flameStages()): number {
  const i = stages.findIndex((s) => level >= s.from && (s.to === null || level <= s.to))
  return i === -1 ? 0 : i
}
