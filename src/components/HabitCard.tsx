import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { CalendarDays, Check, Flag, Flame, GripVertical, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import type { HabitProgress } from '../game/progress'
import { EVERY_DAY, scheduleLabel, scheduleOn } from '../game/schedule'
import { xpForCompletion } from '../game/xp'
import { burstFrom } from '../lib/confetti'
import { playComplete, playUndo } from '../lib/sound'
import { DIFF_STYLE } from '../lib/difficulty'
import type { Habit } from '../lib/types'

interface Props {
  habit: Habit
  hp: HabitProgress
  today: string
  onComplete: (xp: number) => void
  onUndo: () => void
  onEdit: () => void
  /** move one place up (-1) or down (+1), from the keyboard */
  onMove: (dir: -1 | 1) => void
  /** a drag has finished, so the new order should be saved */
  onDragEnd: () => void
}

export function HabitCard({ habit, hp, today, onComplete, onUndo, onEdit, onMove, onDragEnd }: Props) {
  const drag = useDragControls()
  const btn = useRef<HTMLButtonElement>(null)
  const [floats, setFloats] = useState<{ id: number; xp: number }[]>([])
  const xp = xpForCompletion(habit.difficulty, hp.streakBeforeToday)
  const bonus = xp - xpForCompletion(habit.difficulty, 0)
  const done = hp.doneToday
  const days = scheduleOn(habit, today)

  function toggle() {
    if (done) {
      playUndo()
      onUndo()
      return
    }
    const newStreak = hp.streakBeforeToday + 1
    playComplete(newStreak)
    burstFrom(btn.current, habit.difficulty === 'hard' ? 1.5 : habit.difficulty === 'medium' ? 1 : 0.7)
    navigator.vibrate?.(20)
    const id = Date.now()
    setFloats((f) => [...f, { id, xp }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1200)
    onComplete(xp)
  }

  return (
    <Reorder.Item
      value={habit.id}
      dragListener={false}
      dragControls={drag}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 12px 30px -8px rgb(0 0 0 / 0.6)', zIndex: 10 }}
      className={`group relative flex items-center gap-2 rounded-2xl border p-3 pl-1.5 transition-colors sm:gap-3 sm:p-4 sm:pl-2 ${
        done ? 'sun-panel-done border-done/40' : 'sun-panel border-line hover:border-primary-soft/50'
      } ${habit.priority ? 'priority-edge' : ''}`}
    >
      {/* Drag to reorder (mouse or touch), or focus and use the arrow keys. Priority habits are
          placed automatically, so they show a flag instead of a handle. */}
      {habit.priority ? (
        <span
          className="grid shrink-0 place-items-center p-1 text-sun-blaze-orange/80"
          title="Priority habits are listed first automatically: hardest first, then A–Z"
        >
          <Flag size={16} className="fill-sun-blaze-orange/40" aria-hidden />
          <span className="sr-only">Priority habit, ordered automatically</span>
        </span>
      ) : (
        <button
          type="button"
          onPointerDown={(e) => drag.start(e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              onMove(e.key === 'ArrowUp' ? -1 : 1)
            }
          }}
          aria-label={`Reorder ${habit.title}. Drag, or use the up and down arrow keys`}
          className="shrink-0 cursor-grab touch-none rounded-md p-1 text-faint transition hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      )}

      <div className={`grid size-12 shrink-0 place-items-center rounded-xl text-2xl transition ${done ? 'bg-done/15' : 'bg-surface-2'}`} aria-hidden>
        {habit.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate font-semibold transition ${done ? 'text-muted' : ''}`}>{habit.title}</p>
          <button
            onClick={onEdit}
            className="shrink-0 rounded-md p-1 text-faint opacity-100 transition hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Edit ${habit.title}`}
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          {habit.priority && (
            <span className="flex items-center gap-1 rounded-full border border-sun-blaze-orange/50 bg-sun-crimson/15 px-2 py-0.5 font-semibold text-sun-blaze-orange">
              <Flag size={11} className="fill-sun-blaze-orange/50" /> Priority
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${DIFF_STYLE[habit.difficulty]}`}>{habit.difficulty}</span>
          {days.length < EVERY_DAY.length && (
            <span className="flex items-center gap-1 text-muted" title="Due on these days">
              <CalendarDays size={12} aria-hidden /> {scheduleLabel(days)}
            </span>
          )}
          <span className={`flex items-center gap-0.5 font-semibold ${hp.currentStreak > 0 ? 'text-streak' : 'text-faint'}`} title="Current streak">
            <Flame size={13} className={hp.currentStreak > 0 ? 'fill-streak/40' : ''} />
            {hp.currentStreak}
          </span>
          {hp.bestStreak > 0 && <span className="text-faint">best {hp.bestStreak}</span>}
          <span className={`font-bold sm:hidden ${done ? 'text-done' : 'text-xp'}`}>{done ? 'Done' : `+${xp} XP`}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right text-sm sm:block">
          <p className={`font-bold ${done ? 'text-done' : 'text-xp'}`}>{done ? 'Done' : `+${xp} XP`}</p>
          {!done && bonus > 0 && <p className="text-xs text-streak">+{bonus} streak bonus</p>}
        </div>
        <motion.button
          ref={btn}
          onClick={toggle}
          whileTap={{ scale: 0.85 }}
          aria-pressed={done}
          aria-label={done ? `Undo ${habit.title}` : `Complete ${habit.title} for ${xp} XP`}
          className={`relative grid size-12 place-items-center rounded-full border-2 transition-colors ${
            done ? 'border-done bg-done text-bg' : 'border-faint text-transparent hover:border-done hover:text-done/50'
          }`}
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={String(done)}
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Check size={26} strokeWidth={3.5} className={done ? '' : 'text-inherit'} />
            </motion.span>
          </AnimatePresence>
          {done && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-done"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {floats.map((f) => (
          <motion.span
            key={f.id}
            aria-hidden
            className="pointer-events-none absolute right-6 top-0 text-xl font-extrabold text-xp drop-shadow-[0_0_8px_rgb(251_191_36/0.7)]"
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -48, opacity: [0, 1, 1, 0], scale: 1.1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            +{f.xp} XP
          </motion.span>
        ))}
      </AnimatePresence>
    </Reorder.Item>
  )
}
