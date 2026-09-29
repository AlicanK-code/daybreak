import { AnimatePresence, Reorder, motion } from 'motion/react'
import { ChevronDown, History, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DayOverview } from '../components/DayOverview'
import { HabitCard } from '../components/HabitCard'
import { HabitForm } from '../components/HabitForm'
import { Modal } from '../components/Modal'
import { useCreateHabit, useDeleteHabit, useReorderHabits, useToggleCompletion, useUpdateHabit } from '../data/queries'
import type { Progress } from '../game/progress'
import { dayOverview } from '../game/stats'
import { addDays, formatDay } from '../lib/dates'
import { moveItem, orderHabits } from '../lib/order'
import type { Completion, Habit } from '../lib/types'

interface Props {
  habits: Habit[]
  completions: Completion[]
  progress: Progress
  today: string
  onError: (message: string) => void
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function TodayView({ habits, completions, progress, today, onError }: Props) {
  // Yesterday's unticked habits, offered as a shortcut to fill them in.
  const yesterday = addDays(today, -1)
  const yesterdayMissed = useMemo(() => dayOverview(habits, completions, yesterday).missed.length, [habits, completions, yesterday])
  const [reviewDay, setReviewDay] = useState<string | null>(null)
  const [editing, setEditing] = useState<Habit | 'new' | null>(null)
  const toggle = useToggleCompletion()
  const create = useCreateHabit()
  const update = useUpdateHabit()
  const remove = useDeleteHabit()
  const reorder = useReorderHabits()
  // While a habit is being dragged, the list follows this local order; it's saved on drop.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null)

  // Unfinished habits first, finished ones below. Within each, priority habits come first in a fixed
  // order (hardest first, then A–Z) and the rest follow the player's own drag-and-drop order, which
  // is the only part that can be rearranged.
  const doneToday = new Set([...progress.habits].filter(([, hp]) => hp.doneToday).map(([id]) => id))
  const active = orderHabits(
    habits.filter((h) => !h.archivedAt),
    doneToday,
  )
  const byId = new Map(active.map((h) => [h.id, h]))
  const movable = active.filter((h) => !h.priority).map((h) => h.id)
  const ids = dragOrder ?? active.map((h) => h.id)
  const saveOrder = (next: string[], onSettled?: () => void) =>
    reorder.mutate(next, { onError: fail("Couldn't save the new order"), onSettled })
  // Save only the non-priority order (priority habits snap back to their place), and keep showing
  // the dropped order until the save settles, so the list doesn't flick back first.
  const commitDrag = () => {
    const next = dragOrder?.filter((id) => !byId.get(id)?.priority)
    if (next && next.join() !== movable.join()) saveOrder(next, () => setDragOrder(null))
    else setDragOrder(null)
  }
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

      {yesterdayMissed > 0 && (
        <button
          type="button"
          onClick={() => setReviewDay(yesterday)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-left text-sm text-muted transition hover:border-primary-soft/60 hover:text-ink"
        >
          <History size={17} className="shrink-0 text-primary-soft" />
          <span className="flex-1">
            {yesterdayMissed} habit{yesterdayMissed === 1 ? '' : 's'} not ticked off yesterday.
          </span>
          <span className="shrink-0 font-semibold text-primary-soft">Fill in</span>
        </button>
      )}
      <DayOverview day={reviewDay} today={today} habits={habits} completions={completions} onClose={() => setReviewDay(null)} />

      {active.length > 0 && (
        <Reorder.Group axis="y" values={ids} onReorder={setDragOrder} className="space-y-2.5">
          <AnimatePresence initial={false}>
            {ids.map((id) => byId.get(id)).filter((h) => h !== undefined).map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                hp={progress.habits.get(h.id)!}
                onEdit={() => setEditing(h)}
                onMove={(dir) => {
                  // Move within its own group (unfinished or finished), keeping the other group as is.
                  const finished = doneToday.has(h.id)
                  const group = movable.filter((id) => doneToday.has(id) === finished)
                  const other = movable.filter((id) => doneToday.has(id) !== finished)
                  const i = group.indexOf(h.id)
                  if (i === -1) return
                  const moved = moveItem(group, i, i + dir)
                  saveOrder(finished ? [...other, ...moved] : [...moved, ...other])
                }}
                onDragEnd={commitDrag}
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
        </Reorder.Group>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setEditing('new')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-4 font-semibold text-muted transition hover:border-primary hover:text-primary-soft"
      >
        <Plus size={20} /> New habit
      </motion.button>

      <TurnedOff
        habits={habits.filter((h) => h.archivedAt)}
        onTurnOn={(h) => update.mutate({ id: h.id, patch: { archivedAt: null } }, { onError: fail("Couldn't turn that habit back on") })}
      />

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
            onTurnOff={() =>
              update.mutate({ id: editing.id, patch: { archivedAt: new Date().toISOString() } }, { onSuccess: closeForm, onError: fail("Couldn't turn that habit off") })
            }
            onDelete={() => remove.mutate(editing.id, { onSuccess: closeForm, onError: fail("Couldn't delete habit") })}
          />
        )}
      </Modal>
    </div>
  )
}

/**
 * Habits that are switched off: hidden from Today and not counted until switched back on. Tucked
 * into a collapsible list below the habits, each with a switch to turn it back on.
 */
function TurnedOff({ habits, onTurnOn }: { habits: Habit[]; onTurnOn: (h: Habit) => void }) {
  const [open, setOpen] = useState(false)
  if (habits.length === 0) return null
  return (
    <section className="sun-panel rounded-2xl border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <span>
          Turned off <span className="text-faint">· {habits.length}</span>
        </span>
        <ChevronDown size={18} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="space-y-1.5 border-t border-line p-3">
          {habits.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-xl p-1.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-lg opacity-50" aria-hidden>
                {h.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-muted">{h.title}</p>
                <p className="text-xs text-faint capitalize">{h.difficulty}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={false}
                onClick={() => onTurnOn(h)}
                aria-label={`Turn ${h.title} back on`}
                title="Turn back on"
                className="relative h-6 w-10 shrink-0 rounded-full bg-surface-2 ring-1 ring-line transition hover:ring-primary-soft"
              >
                <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-faint shadow transition-all" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
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
