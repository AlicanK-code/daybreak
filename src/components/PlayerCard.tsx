import { motion } from 'motion/react'
import { Flame } from 'lucide-react'
import type { Progress } from '../game/progress'
import { SunFlameBar } from './SunFlameBar'

export function PlayerCard({ name, progress, ready }: { name: string; progress: Progress; ready: boolean }) {
  const { level, dayStreak } = progress
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface/80 p-4 backdrop-blur" aria-label="Player">
      <motion.div
        key={level.level}
        initial={{ scale: 0.6, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-soft to-primary shadow-lg shadow-primary/30"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80 absolute top-1.5">Lvl</span>
        <span className="mt-2 text-2xl font-extrabold text-white">{level.level}</span>
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{name}</p>
            <p className="text-sm text-primary-soft">{level.title}</p>
          </div>
          <div
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${dayStreak > 0 ? 'bg-streak/15 text-streak' : 'bg-surface-2 text-faint'}`}
            title="Days in a row with at least one habit completed"
          >
            <Flame size={16} className={dayStreak > 0 ? 'fill-streak/40' : ''} />
            {dayStreak} day{dayStreak === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-6">
          <SunFlameBar level={level} ready={ready} />
          <p className="mt-4 flex justify-between text-xs text-muted">
            <span>
              <span className="font-semibold text-xp">{level.xpIntoLevel}</span> / {level.xpForNextLevel} XP
            </span>
            <span>{level.xpForNextLevel - level.xpIntoLevel} XP to level {level.level + 1}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
