import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { motion, useAnimate, useReducedMotion } from 'motion/react'
import type { LevelInfo } from '../game/xp'
import { flameStreaks } from '../lib/flames'
import { playWhoosh } from '../lib/sound'

const FILL_SPRING = { type: 'spring', stiffness: 120, damping: 20 } as const
// Pale rim light plus a red bloom, like cel-shaded fire art.
const FLAME_GLOW = 'brightness(1) drop-shadow(0 0 1.5px rgb(255 226 210 / 0.8)) drop-shadow(0 0 5px rgb(255 60 20 / 0.6))'
const FLAME_FLARE = 'brightness(1.7) drop-shadow(0 0 2px rgb(255 236 220 / 1)) drop-shadow(0 0 10px rgb(255 122 26 / 1))'
// A stronger, steady glow for the tail, the main thrust behind the disc.
const FLAME_FLARE_SOFT = 'brightness(1.15) drop-shadow(0 0 2px rgb(255 236 220 / 0.9)) drop-shadow(0 0 8px rgb(255 122 26 / 0.9))'

// Small streaks of flame that shoot off the bar (viewBox 0 0 12 4, head at the right, pointing
// the way they fly): a tapered streak, one with a flick off its back, a slim hot streak and a
// double streak, each with its own colour.
const STREAKS = [
  { d: 'M0 2C4 1.2 8 .4 12 2 8 3.6 4 2.8 0 2Z', fill: 'var(--color-sun-blaze-orange)' },
  { d: 'M0 2.2C3 1.6 6 .2 9 .6L8 1.4C10 1.4 11.3 1.8 12 2.2 9 3.6 5 3.2 0 2.2Z', fill: 'var(--color-sun-blaze)' },
  { d: 'M0 2C5 1.6 9 1.2 12 2 9 2.8 5 2.4 0 2Z', fill: 'var(--color-sun-streak)' },
  { d: 'M0 1.5C4 1 8 .5 12 1.5 8 2 4 2 0 1.5ZM2 3C5 2.6 8 2.3 10 3 8 3.4 5 3.4 2 3Z', fill: 'var(--color-sun-blaze-orange)' },
]
// The tail streaming out of the sun disc (viewBox 0 0 168 40, disc at the right, centred on
// y 20): one solid body that forks into three prongs partway back, a short one sweeping over the
// top, a long one straight back (the main thrust) and one sweeping under the bottom.
const TAIL =
  'M168 11C150 8 118 3 84 3 104 7 118 11 124 15 100 17 50 19 0 20 50 21 100 23 122 25 114 29 98 34 72 37 110 36 146 32 168 29Z'
// Hot streaks running from the shared body out into each prong, strongest down the middle.
const TAIL_CORES = [
  { d: 'M168 17C140 18 100 19.2 10 20 100 20.8 140 22 168 23Z', opacity: 0.9 },
  { d: 'M162 14C140 11 115 7 92 5 115 8.5 138 12.5 162 16Z', opacity: 0.6 },
  { d: 'M162 26C140 29.5 110 33 80 36 110 33.5 140 30 162 24Z', opacity: 0.6 },
]

/**
 * XP bar styled after a sun-breathing flame technique: a burning blade with a sun disc at its tip
 * trailing a three-pronged tail of fire, and small streaks of flame shooting off the bar in different
 * directions. Everything tracks the fill, so it moves with your XP.
 * `ready` is false while data loads, so the jump from 0 to the real total doesn't count as a gain.
 */
export function SunFlameBar({ level, ready }: { level: LevelInfo; ready: boolean }) {
  const reduced = useReducedMotion()
  const id = useId()
  const [flamesRef, animateFlames] = useAnimate<HTMLDivElement>()
  const width = `${Math.max(level.progress * 100, 2)}%`
  const streaks = useMemo(() => flameStreaks(level.progress), [level.progress])

  // Count XP gains (not undos, not the initial load) to trigger the flare and whoosh.
  const [prevXp, setPrevXp] = useState<number | null>(ready ? level.totalXp : null)
  const [surge, setSurge] = useState(0)
  if (ready && level.totalXp !== prevXp) {
    if (prevXp !== null && level.totalXp > prevXp) setSurge((s) => s + 1)
    setPrevXp(level.totalXp)
  }

  useEffect(() => {
    if (surge === 0) return
    playWhoosh()
    if (flamesRef.current) void animateFlames(flamesRef.current, { filter: [FLAME_FLARE, FLAME_GLOW] }, { duration: 1.1, ease: 'easeOut' })
  }, [surge, flamesRef, animateFlames])

  return (
    <div
      className="relative h-3.5 rounded-full bg-bg ring-1 ring-sun-ember/40"
      role="progressbar"
      aria-label="XP to next level"
      aria-valuemin={0}
      aria-valuemax={level.xpForNextLevel}
      aria-valuenow={level.xpIntoLevel}
    >
      {!reduced && (
        // Behind the fill, so the streaks look like they're coming off its edges.
        <motion.div aria-hidden className="pointer-events-none absolute inset-y-0 left-0" initial={false} animate={{ width }} transition={FILL_SPRING}>
          <svg width="0" height="0" className="absolute">
            {/* Burn for the tails: hottest at the disc end (right), cooling to ember red */}
            <linearGradient id={`${id}-sweep`} x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--color-sun-blaze-hot)" />
              <stop offset="30%" stopColor="var(--color-sun-blaze-orange)" />
              <stop offset="65%" stopColor="var(--color-sun-blaze)" />
              <stop offset="100%" stopColor="var(--color-sun-blaze-deep)" stopOpacity="0.4" />
            </linearGradient>
          </svg>

          <div ref={flamesRef} className="absolute inset-0" style={{ filter: FLAME_GLOW }}>
            {streaks.map((f, i) => (
              <svg
                key={i}
                viewBox="0 0 12 4"
                preserveAspectRatio="none"
                className="absolute -translate-1/2 animate-sun-fleck"
                style={
                  {
                    left: `${f.left}%`,
                    top: f.edge === 'top' ? '0%' : '100%',
                    width: f.size,
                    height: f.size / 3,
                    animationDuration: `${f.duration}s`,
                    animationDelay: `${f.delay}s`,
                    '--dx': `${f.dx}px`,
                    '--dy': `${f.dy}px`,
                    '--dir': `${f.dir}deg`,
                  } as CSSProperties
                }
              >
                <path d={STREAKS[f.shape].d} fill={STREAKS[f.shape].fill} stroke="var(--color-sun-outline)" strokeWidth="0.3" />
              </svg>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div className="sun-fill relative h-full overflow-hidden rounded-full" initial={false} animate={{ width }} transition={FILL_SPRING}>
        {!reduced && <span className="sun-flow absolute inset-0" />}
      </motion.div>

      {!reduced && (
        // The sun disc at the blade's tip
        <motion.div aria-hidden className="pointer-events-none absolute inset-y-0 left-0" initial={false} animate={{ width }} transition={FILL_SPRING}>
          {/* In front of the bar and behind the disc, so the tail visibly leaves the disc and
              pushes it towards the end of the bar. It pulses from the disc as one flame. */}
          <svg
            viewBox="0 0 168 40"
            preserveAspectRatio="none"
            className="absolute top-[calc(50%-20px)] right-0 h-10 w-[min(10.5rem,100%)] origin-right animate-sun-lick"
            style={{ filter: FLAME_FLARE_SOFT }}
          >
            <path d={TAIL} fill={`url(#${id}-sweep)`} />
            {TAIL_CORES.map((c, i) => (
              <path key={i} d={c.d} fill="var(--color-sun-streak)" opacity={c.opacity} />
            ))}
          </svg>
          <span className="absolute top-1/2 right-0 size-9 translate-x-1/2 -translate-y-1/2">
            <span className="absolute inset-1.5 animate-sun-pulse rounded-full bg-[radial-gradient(circle,var(--color-sun-core)_18%,var(--color-sun-gold)_40%,var(--color-sun-blaze-orange)_58%,transparent_74%)]" />
            {surge > 0 && (
              <motion.span
                key={surge}
                className="absolute inset-0 rounded-full border-2 border-sun-blaze-orange"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            )}
          </span>
        </motion.div>
      )}
    </div>
  )
}
