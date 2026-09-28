import { useState } from 'react'
import { motion } from 'motion/react'
import { Flame, Pencil } from 'lucide-react'
import type { Progress } from '../game/progress'
import { LevelBadge } from './LevelFlame'
import { LevelFlames } from './LevelFlames'
import { SunFlameBar } from './SunFlameBar'

interface Props {
  name: string
  progress: Progress
  ready: boolean
  onEditName: () => void
}

export function PlayerCard({ name, progress, ready, onEditName }: Props) {
  const { level, dayStreak } = progress
  const [showLevels, setShowLevels] = useState(false)
  return (
    <section className="sun-card relative flex items-center gap-4 rounded-2xl border border-sun-crimson/50 p-4" aria-label="Player">
      {/* Level badge: a flame that grows and gets fiercer with each level; it pops on level-up.
          Tapping it shows every flame stage. */}
      <motion.button
        type="button"
        key={level.level}
        onClick={() => setShowLevels(true)}
        aria-label={`Level ${level.level}. View all level flames`}
        title="View level flames"
        initial={{ scale: 0.6, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        className="shrink-0 origin-bottom cursor-pointer rounded-xl"
      >
        <LevelBadge level={level.level} />
      </motion.button>
      <LevelFlames open={showLevels} level={level.level} onClose={() => setShowLevels(false)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onEditName}
              className="group flex max-w-full items-center gap-1.5 rounded-md text-left font-bold"
              aria-label={`Change username (currently ${name})`}
              title="Change username"
            >
              <span className="truncate">{name}</span>
              <Pencil size={13} className="shrink-0 text-sun-ash/60 transition group-hover:text-sun-gold group-focus-visible:text-sun-gold" />
            </button>
            <p className="text-sm font-medium text-sun-gold">{level.title}</p>
          </div>
          <div
            className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-semibold ${dayStreak > 0 ? 'border-sun-blaze-orange/40 bg-sun-crimson/15 text-sun-blaze-orange' : 'border-line bg-surface-2 text-faint'}`}
            title="Days in a row with at least one habit completed"
          >
            <Flame size={16} className={dayStreak > 0 ? 'fill-sun-blaze-orange/50' : ''} />
            {dayStreak} day{dayStreak === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-6">
          <SunFlameBar level={level} ready={ready} />
          <p className="mt-4 flex justify-between text-xs text-sun-ash">
            <span>
              <span className="font-semibold text-sun-gold">{level.xpIntoLevel}</span> / {level.xpForNextLevel} XP
            </span>
            <span>{level.xpForNextLevel - level.xpIntoLevel} XP to level {level.level + 1}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
