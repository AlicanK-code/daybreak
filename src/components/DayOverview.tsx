import { useMemo, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useToggleCompletion } from '../data/queries'
import { EDIT_WINDOW_DAYS, canEditHabitOn, isEditableDay, xpForDay } from '../game/backfill'
import { isBackfilled } from '../game/days'
import { dayOverview } from '../game/stats'
import { formatDay, toDayKey } from '../lib/dates'
import { DIFF_STYLE } from '../lib/difficulty'
import { playComplete, playUndo } from '../lib/sound'
import type { Completion, Habit } from '../lib/types'
import { Modal } from './Modal'

interface Props {
  /** the day to show, or null when closed */
  day: string | null
  today: string
  habits: Habit[]
  completions: Completion[]
  onClose: () => void
}

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/**
 * A dialog summarising one day: what was done (with XP and time) and what was missed. Within the
 * last week, each habit can be switched between done and not done, so a forgotten tick can be
 * filled in.
 */
export function DayOverview({ day, today, habits, completions, onClose }: Props) {
  const title = day ? formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  return (
    <Modal open={day !== null} onClose={onClose} title={day === today ? `Today · ${title}` : title}>
      {day && <DayOverviewBody day={day} today={today} habits={habits} completions={completions} />}
    </Modal>
  )
}

function DayOverviewBody({ day, today, habits, completions }: { day: string; today: string; habits: Habit[]; completions: Completion[] }) {
  const o = useMemo(() => dayOverview(habits, completions, day), [habits, completions, day])
  const toggle = useToggleCompletion()
  const [error, setError] = useState<string | null>(null)
  const isToday = day === today
  const editable = isEditableDay(day, today)
  const dayName = formatDay(day, { weekday: 'long', day: 'numeric', month: 'short' })

  const markDone = (habit: Habit) => {
    const xp = xpForDay(habit, completions, day)
    setError(null)
    playComplete()
    toggle.mutate(
      { type: 'add', input: { habitId: habit.id, completedOn: day, xpEarned: xp } },
      { onError: () => setError(`Couldn't mark ${habit.title} as done. Try again.`) },
    )
  }
  const markNotDone = (habit: Habit) => {
    setError(null)
    playUndo()
    toggle.mutate({ type: 'remove', habitId: habit.id, day }, { onError: () => setError(`Couldn't undo ${habit.title}. Try again.`) })
  }

  if (o.total === 0) {
    return <p className="py-4 text-center text-sm text-muted">No habits were being tracked on this day.</p>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-surface-2 px-3 py-1 font-semibold">
          <span className={o.done.length ? 'text-done' : 'text-muted'}>{o.done.length}</span>
          <span className="text-muted"> / {o.total} done</span>
        </span>
        <span className="rounded-full bg-xp/15 px-3 py-1 font-semibold text-xp">+{o.xp} XP</span>
        {o.perfect && (
          <span className="flex items-center gap-1 rounded-full border border-sun-blaze-orange/40 bg-sun-crimson/15 px-3 py-1 font-semibold text-sun-blaze-orange">
            <Sparkles size={14} /> Perfect day
          </span>
        )}
      </div>

      {o.done.length > 0 && (
        <section aria-label="Completed">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Completed</h3>
          <ul className="space-y-1.5">
            {o.done.map(({ habit, completion }) => {
              const late = isBackfilled(completion)
              return (
                <li key={habit.id} className="flex items-center gap-3 rounded-xl border border-done/30 bg-done/[0.07] p-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-done/15 text-lg" aria-hidden>
                    {habit.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{habit.title}</p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span className={`rounded-full px-1.5 py-px font-semibold capitalize ${DIFF_STYLE[habit.difficulty]}`}>{habit.difficulty}</span>
                      {late ? (
                        <span className="rounded-full border border-line px-1.5 py-px text-faint" title={`Filled in on ${formatDay(toDayKey(new Date(completion.completedAt)), { weekday: 'short', day: 'numeric', month: 'short' })}`}>
                          Added later
                        </span>
                      ) : (
                        <span>at {time(completion.completedAt)}</span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-xp">+{completion.xpEarned} XP</span>
                  {canEditHabitOn(habit, day, today) ? (
                    <button
                      type="button"
                      onClick={() => markNotDone(habit)}
                      disabled={toggle.isPending}
                      aria-label={`Mark ${habit.title} as not done on ${dayName}`}
                      title="Tap to undo"
                      className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-done bg-done text-bg transition hover:brightness-110 active:scale-90 disabled:opacity-60"
                    >
                      <Check size={16} strokeWidth={3.5} />
                    </button>
                  ) : (
                    <Check size={18} strokeWidth={3} className="shrink-0 text-done" aria-label="Done" />
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {o.missed.length > 0 && (
        <section aria-label={isToday ? 'Still to do' : 'Missed'}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{isToday ? 'Still to do' : 'Missed'}</h3>
          <ul className="space-y-1.5">
            {o.missed.map((habit) => {
              const canEdit = canEditHabitOn(habit, day, today)
              const xp = xpForDay(habit, completions, day)
              return (
                <li key={habit.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-lg opacity-60" aria-hidden>
                    {habit.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-muted">{habit.title}</p>
                    <p className="text-xs">
                      <span className={`rounded-full px-1.5 py-px font-semibold capitalize opacity-70 ${DIFF_STYLE[habit.difficulty]}`}>{habit.difficulty}</span>
                    </p>
                  </div>
                  {canEdit ? (
                    <>
                      <span className="shrink-0 text-sm font-bold text-xp/70">+{xp} XP</span>
                      <button
                        type="button"
                        onClick={() => markDone(habit)}
                        disabled={toggle.isPending}
                        aria-label={`Mark ${habit.title} as done on ${dayName} for ${xp} XP`}
                        title="Tap to mark as done"
                        className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-faint text-transparent transition hover:border-done hover:text-done/60 active:scale-90 disabled:opacity-60"
                      >
                        <Check size={16} strokeWidth={3.5} />
                      </button>
                    </>
                  ) : (
                    !isToday && <span className="shrink-0 text-lg font-bold text-danger/80" aria-label="Missed">✕</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {!isToday && (
        <p className="text-xs text-faint">
          {editable
            ? `Forgot to tick something? Tap to fill in or undo habits from the last ${EDIT_WINDOW_DAYS} days. Filled-in days earn the XP they would have on the day.`
            : `Days more than ${EDIT_WINDOW_DAYS} days ago can't be changed.`}
        </p>
      )}
    </div>
  )
}
