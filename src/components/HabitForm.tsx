import { useState, type FormEvent } from 'react'
import { Flag, PowerOff, Trash2 } from 'lucide-react'
import { EVERY_DAY, scheduleLabel, scheduleOn, withSchedule } from '../game/schedule'
import { BASE_XP } from '../game/xp'
import type { Difficulty, Habit, NewHabit } from '../lib/types'

const ICONS = ['⭐', '🏋️', '🏃', '🧘', '📚', '✍️', '💻', '🧠', '💧', '🥗', '😴', '🧹', '💰', '🎸', '🌱', '🗺️', '📵', '🙏', '💊', '🐕']

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'easy', label: 'Easy', hint: 'Quick win' },
  { id: 'medium', label: 'Medium', hint: 'Takes effort' },
  { id: 'hard', label: 'Hard', hint: 'A real grind' },
]

const WEEKDAYS = [
  { label: 'M', name: 'Monday' },
  { label: 'T', name: 'Tuesday' },
  { label: 'W', name: 'Wednesday' },
  { label: 'T', name: 'Thursday' },
  { label: 'F', name: 'Friday' },
  { label: 'S', name: 'Saturday' },
  { label: 'S', name: 'Sunday' },
]

// Jump straight into the title on devices with a mouse; on touch screens that would pop up the
// keyboard over the form.
const finePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

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
  const [confirmDelete, setConfirmDelete] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (t) onSubmit({ title: t, icon, difficulty, priority, schedule: withSchedule(initial?.schedule ?? [], days, today) })
  }

  return (
    <form onSubmit={submit} className="space-y-3.5 roomy:space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Habit</span>
        <input
          autoFocus={!initial && finePointer()}
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Read 20 pages"
          className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-primary"
        />
      </label>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-muted">Icon</legend>
        <div className="grid grid-cols-10 gap-1">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              aria-label={`Icon ${i}`}
              aria-pressed={icon === i}
              className={`grid aspect-square place-items-center rounded-lg text-xl transition ${icon === i ? 'bg-primary/25 ring-2 ring-primary' : 'hover:bg-surface-2'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-muted">Difficulty</legend>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              aria-pressed={difficulty === d.id}
              className={`rounded-xl border p-2 text-left transition roomy:p-2.5 ${difficulty === d.id ? 'border-primary bg-primary/15' : 'border-line hover:border-faint'}`}
            >
              <span className="block font-semibold">{d.label}</span>
              <span className="hidden text-xs text-muted roomy:block">{d.hint}</span>
              <span className="block text-sm font-bold text-xp roomy:mt-1">+{BASE_XP[d.id]} XP</span>
            </button>
          ))}
        </div>
      </fieldset>

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

      <button
        disabled={busy || !title.trim()}
        className="w-full rounded-xl bg-primary py-2.5 font-semibold roomy:py-3 text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
      >
        {initial ? 'Save changes' : 'Add habit'}
      </button>

      {initial && (
        <div className="flex gap-2 border-t border-line pt-3 roomy:pt-4">
          {onTurnOff && (
            <button type="button" onClick={onTurnOff} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line py-2 text-sm text-muted hover:text-ink">
              <PowerOff size={16} /> Turn off
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-sm transition ${confirmDelete ? 'border-danger bg-danger/15 text-danger' : 'border-line text-muted hover:text-danger'}`}
            >
              <Trash2 size={16} /> {confirmDelete ? 'Tap again — erases history' : 'Delete'}
            </button>
          )}
        </div>
      )}
    </form>
  )
}
