import { useMemo } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import { dayOverview } from '../game/stats'
import { formatDay } from '../lib/dates'
import { DIFF_STYLE } from '../lib/difficulty'
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

/** A dialog summarising one day: what was done (with XP and time) and what was missed. */
export function DayOverview({ day, today, habits, completions, onClose }: Props) {
  const title = day ? formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' }) : ''
  return (
    <Modal open={day !== null} onClose={onClose} title={day === today ? `Today · ${title}` : title}>
      {day && <DayOverviewBody day={day} isToday={day === today} habits={habits} completions={completions} />}
    </Modal>
  )
}

function DayOverviewBody({ day, isToday, habits, completions }: { day: string; isToday: boolean; habits: Habit[]; completions: Completion[] }) {
  const o = useMemo(() => dayOverview(habits, completions, day), [habits, completions, day])

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
            {o.done.map(({ habit, completion }) => (
              <li key={habit.id} className="flex items-center gap-3 rounded-xl border border-done/30 bg-done/[0.07] p-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-done/15 text-lg" aria-hidden>
                  {habit.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{habit.title}</p>
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <span className={`rounded-full px-1.5 py-px font-semibold capitalize ${DIFF_STYLE[habit.difficulty]}`}>{habit.difficulty}</span>
                    <span>at {time(completion.completedAt)}</span>
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-xp">+{completion.xpEarned} XP</span>
                <Check size={18} strokeWidth={3} className="shrink-0 text-done" aria-label="Done" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {o.missed.length > 0 && (
        <section aria-label={isToday ? 'Still to do' : 'Missed'}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{isToday ? 'Still to do' : 'Missed'}</h3>
          <ul className="space-y-1.5">
            {o.missed.map((habit) => (
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
                {!isToday && <X size={18} strokeWidth={3} className="shrink-0 text-danger/80" aria-label="Missed" />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
