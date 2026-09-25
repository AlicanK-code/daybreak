import { motion } from 'motion/react'
import { Flame } from 'lucide-react'
import type { Progress } from '../game/progress'

export function PlayerCard({ name, progress }: { name: string; progress: Progress }) {
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

        <div className="mt-2">
          <div
            className="h-3 overflow-hidden rounded-full bg-bg"
            role="progressbar"
            aria-label="XP to next level"
            aria-valuemin={0}
            aria-valuemax={level.xpForNextLevel}
            aria-valuenow={level.xpIntoLevel}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-xp to-amber-300 shadow-[0_0_12px] shadow-xp/60"
              initial={false}
              animate={{ width: `${Math.max(level.progress * 100, 2)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-1 flex justify-between text-xs text-muted">
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
