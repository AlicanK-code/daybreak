import { useState, type FormEvent } from 'react'
import { Flag, PowerOff } from 'lucide-react'
import { EVERY_DAY, scheduleLabel, scheduleOn, withSchedule } from '../game/schedule'
import type { Difficulty, Habit, NewHabit } from '../lib/types'
import { ICONS } from '../lib/icons'
import { DeleteButton, DifficultyPicker, IconPicker, SubmitButton, TitleField } from './FormParts'

const WEEKDAYS = [
  { label: 'M', name: 'Monday' },
  { label: 'T', name: 'Tuesday' },
  { label: 'W', name: 'Wednesday' },
  { label: 'T', name: 'Thursday' },
  { label: 'F', name: 'Friday' },
  { label: 'S', name: 'Saturday' },
  { label: 'S', name: 'Sunday' },
]

interface Props {
  initial?: Habit
  /** today's day key: a schedule change applies from today on */
  today: string
  busy?: boolean
  onSubmit: (h: NewHabit) => void
  /** switch the habit off: hidden from Today until switched back on */
  onTurnOff?: () => void
  onDelete?: () => void
}

export function HabitForm({ initial, today, busy, onSubmit, onTurnOff, onDelete }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0])
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'medium')
  const [priority, setPriority] = useState(initial?.priority ?? false)
  const startDays = initial ? scheduleOn(initial, today) : EVERY_DAY
  const [days, setDays] = useState<readonly number[]>(startDays)
  const scheduleChanged = scheduleLabel(days) !== scheduleLabel(startDays)
  // At least one day has to stay selected.
  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? (ds.length > 1 ? ds.filter((x) => x !== d) : ds) : [...ds, d]))

  function submit(e: FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (t) onSubmit({ title: t, icon, difficulty, priority, schedule: withSchedule(initial?.schedule ?? [], days, today) })
  }

  return (
    <form onSubmit={submit} className="space-y-3.5 roomy:space-y-5">
      <TitleField label="Habit" placeholder="e.g. Read 20 pages" value={title} onChange={setTitle} isNew={!initial} />
      <IconPicker value={icon} onChange={setIcon} />
      <DifficultyPicker value={difficulty} onChange={setDifficulty} />

      <fieldset>
        <legend className="mb-1.5 flex w-full items-baseline justify-between gap-2 text-sm font-medium text-muted">
          Repeat on <span className="text-xs font-semibold text-primary-soft">{scheduleLabel(days)}</span>
        </legend>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w, d) => {
            const on = days.includes(d)
            return (
              <button
                key={w.name}
                type="button"
                onClick={() => toggleDay(d)}
                aria-pressed={on}
                aria-label={w.name}
                title={on && days.length === 1 ? 'Pick another day first' : w.name}
                className={`grid h-10 place-items-center rounded-full border text-sm font-bold transition roomy:h-11 ${on ? 'border-primary bg-primary/25 text-ink' : 'border-line text-faint hover:border-faint hover:text-muted'}`}
              >
                {w.label}
              </button>
            )
          })}
        </div>
        <p className={`mt-2 text-xs text-faint ${initial && scheduleChanged ? '' : 'hidden roomy:block'}`}>
          {initial && scheduleChanged
            ? 'Applies from today. Past days keep their old schedule, so your streak is safe.'
            : 'Streaks count the days a habit is due, and add +5% XP per day, up to +50%.'}
        </p>
      </fieldset>

      <button
        type="button"
        role="switch"
        aria-checked={priority}
        onClick={() => setPriority((p) => !p)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition roomy:py-3 ${priority ? 'border-sun-blaze-orange/60 bg-sun-crimson/15' : 'border-line hover:border-faint'}`}
      >
        <Flag size={18} className={priority ? 'fill-sun-blaze-orange/50 text-sun-blaze-orange' : 'text-muted'} />
        <span className="flex-1">
          <span className="block font-semibold">Priority</span>
          <span className="hidden text-xs text-muted roomy:block">Label this habit as important</span>
        </span>
        <span className={`relative h-6 w-10 rounded-full transition ${priority ? 'bg-sun-blaze-orange' : 'bg-surface-2'}`} aria-hidden>
          <span className={`absolute top-0.5 size-5 rounded-full bg-ink shadow transition-all ${priority ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
      </button>

      <SubmitButton disabled={!!busy || !title.trim()}>{initial ? 'Save changes' : 'Add habit'}</SubmitButton>

      {initial && (
        <div className="flex gap-2 border-t border-line pt-3 roomy:pt-4">
          {onTurnOff && (
            <button type="button" onClick={onTurnOff} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line py-2 text-sm text-muted hover:text-ink">
              <PowerOff size={16} /> Turn off
            </button>
          )}
          {onDelete && <DeleteButton onDelete={onDelete} warning="Tap again — erases history" />}
        </div>
      )}
    </form>
  )
}
