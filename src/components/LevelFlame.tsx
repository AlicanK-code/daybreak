import { useReducedMotion } from 'motion/react'
import { levelFlame } from '../lib/levelFlame'

/*
 * A flat, layered flame (viewBox 0 0 100 120, base at the bottom centre): a red body with several
 * curling tongues, then orange, yellow and a white-hot core, each nested inside the last.
 */
const LAYERS = {
  outer:
    'M50 120C22 120 4 102 8 78 10 66 16 58 13 44 22 50 27 59 28 68 29 52 35 38 45 26 51 18 53 9 48 0 63 10 71 25 68 42 74 35 78 26 78 15 90 30 96 50 91 68 97 62 100 55 99 46 106 72 100 94 86 108 78 116 65 120 50 120Z',
  mid: 'M50 120C29 120 18 105 21 88 23 78 29 71 28 60 35 66 38 74 39 81 40 66 46 54 56 44 58 57 63 65 65 76 69 70 71 63 71 56 80 69 82 86 78 99 74 113 64 120 50 120Z',
  inner: 'M50 120C36 120 29 110 31 97 33 89 38 83 39 74 44 82 46 89 47 94 49 85 53 79 57 72 59 83 63 90 65 99 67 111 62 120 50 120Z',
  core: 'M50 120C42 120 37 114 39 105 41 99 46 95 48 88 51 97 57 101 59 108 61 116 57 120 50 120Z',
}

/**
 * The level badge: a flame with the level number in its wide lower half. The flame grows and gets
 * fiercer with each level; the number stays a fixed, readable size.
 */
export function LevelBadge({ level, animate = true }: { level: number; animate?: boolean }) {
  const reduced = useReducedMotion()
  const f = levelFlame(level)
  return (
    <div role="img" aria-label={`Level ${level}`} className="relative shrink-0" style={{ width: f.width, height: f.height }}>
      <svg
        viewBox="0 0 100 120"
        aria-hidden
        className={`absolute inset-0 size-full overflow-visible ${animate && !reduced ? 'level-flame-flicker' : ''}`}
        style={{ filter: f.glow, animationDuration: `${f.flicker}s` }}
      >
        {/* Thin ember outline so the flame reads against the dark card at every level. */}
        <path d={LAYERS.outer} fill={f.colors.outer} stroke="var(--color-sun-outline)" strokeWidth="1.25" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={LAYERS.mid} fill={f.colors.mid} />
        <path d={LAYERS.inner} fill={f.colors.inner} />
        <path d={LAYERS.core} fill={f.colors.core} />
      </svg>
      <span aria-hidden className="level-number absolute inset-x-0 bottom-[14%] text-center text-2xl leading-none font-extrabold text-white">
        {level}
      </span>
    </div>
  )
}
