import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { HabitCard } from '../components/HabitCard'
import { HabitForm } from '../components/HabitForm'
import { Modal } from '../components/Modal'
import { useCreateHabit, useDeleteHabit, useToggleCompletion, useUpdateHabit } from '../data/queries'
import type { Progress } from '../game/progress'
import { formatDay } from '../lib/dates'
import type { Habit } from '../lib/types'

interface Props {
  habits: Habit[]
  progress: Progress
  today: string
  onError: (message: string) => void
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function TodayView({ habits, progress, today, onError }: Props) {
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const toggle = useToggleCompletion()
  const create = useCreateHabit()
  const update = useUpdateHabit()
  const remove = useDeleteHabit()

  const active = habits.filter((h) => !h.archivedAt)
  const { todayDone, todayTotal } = progress
  const allDone = todayTotal > 0 && todayDone === todayTotal

  const closeForm = () => setEditing(null)
  const fail = (m: string) => () => onError(m)

  return (
    <div className="space-y-4">
      <section className="sun-panel flex items-center gap-4 rounded-2xl border border-line p-4">
        <ProgressRing value={todayDone} total={todayTotal} />
        <div className="min-w-0">
          <p className="text-sm text-muted">{formatDay(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="text-xl font-bold">
            {todayTotal === 0 ? `${greeting()}!` : allDone ? 'All quests complete! 🎉' : `${greeting()}!`}
          </p>
          <p className="text-sm text-muted">
            {todayTotal === 0
              ? 'Add your first daily habit to start earning XP.'
              : allDone
                ? 'Your streaks are safe. Rest well, adventurer.'
                : `${todayTotal - todayDone} quest${todayTotal - todayDone === 1 ? '' : 's'} left today`}
          </p>
          {progress.xpToday > 0 && <p className="mt-0.5 text-sm font-semibold text-xp">+{progress.xpToday} XP earned today</p>}
        </div>
      </section>

      {active.length > 0 && (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {active.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                hp={progress.habits.get(h.id)!}
                onEdit={() => setEditing(h)}
                onComplete={(xp) =>
                  toggle.mutate(
                    { type: 'add', input: { habitId: h.id, completedOn: today, xpEarned: xp } },
                    { onError: fail("Couldn't save that completion") },
                  )
                }
                onUndo={() => toggle.mutate({ type: 'remove', habitId: h.id, day: today }, { onError: fail("Couldn't undo that") })}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setEditing('new')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-4 font-semibold text-muted transition hover:border-primary hover:text-primary-soft"
      >
        <Plus size={20} /> New habit
      </motion.button>

      <Modal open={editing !== null} onClose={closeForm} title={editing === 'new' ? 'New habit' : 'Edit habit'}>
        {editing === 'new' && (
          <HabitForm
            busy={create.isPending}
            onSubmit={(h) => create.mutate(h, { onSuccess: closeForm, onError: fail("Couldn't create habit") })}
          />
        )}
        {editing && editing !== 'new' && (
          <HabitForm
            key={editing.id}
            initial={editing}
            busy={update.isPending}
            onSubmit={(patch) => update.mutate({ id: editing.id, patch }, { onSuccess: closeForm, onError: fail("Couldn't save habit") })}
            onArchive={() =>
              update.mutate({ id: editing.id, patch: { archivedAt: new Date().toISOString() } }, { onSuccess: closeForm, onError: fail("Couldn't archive habit") })
            }
            onDelete={() => remove.mutate(editing.id, { onSuccess: closeForm, onError: fail("Couldn't delete habit") })}
          />
        )}
      </Modal>
    </div>
  )
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const pct = total ? value / total : 0
  const done = total > 0 && value === total
  return (
    <div className="relative size-20 shrink-0" role="img" aria-label={`${value} of ${total} habits done today`}>
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-bg" />
        <motion.circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={done ? 'stroke-done' : 'stroke-primary'}
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-extrabold">
          {value}
          <span className="text-sm text-muted">/{total}</span>
        </span>
      </div>
    </div>
  )
}
