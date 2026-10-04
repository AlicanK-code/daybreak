import { useState, type FormEvent } from 'react'
import { dueDateProblem, dueDateRange } from '../game/tasks'
import { addDays } from '../lib/dates'
import type { Difficulty, NewTask, Task } from '../lib/types'
import { ICONS } from '../lib/icons'
import { DeleteButton, DifficultyPicker, IconPicker, SubmitButton, TitleField } from './FormParts'

type DueChoice = 'today' | 'tomorrow' | 'date' | 'none'

interface Props {
  initial?: Task
  today: string
  busy?: boolean
  onSubmit: (t: NewTask) => void
  onDelete?: () => void
}

export function TaskForm({ initial, today, busy, onSubmit, onDelete }: Props) {
  const tomorrow = addDays(today, 1)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0])
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'easy')
  const [dueOn, setDueOn] = useState<string | null>(initial ? initial.dueOn : today)
  // "Pick a date" stays selected while choosing, even if the picked date happens to be today.
  const [picking, setPicking] = useState(initial?.dueOn != null && initial.dueOn !== today && initial.dueOn !== tomorrow)
  const range = dueDateRange(today, initial?.dueOn)
  const dateProblem = dueDateProblem(dueOn, today, initial?.dueOn)
  const choice: DueChoice = picking ? 'date' : dueOn === null ? 'none' : dueOn === today ? 'today' : dueOn === tomorrow ? 'tomorrow' : 'date'

  const choose = (c: DueChoice) => {
    setPicking(c === 'date')
    if (c === 'today') setDueOn(today)
    if (c === 'tomorrow') setDueOn(tomorrow)
    if (c === 'none') setDueOn(null)
    if (c === 'date' && (dueOn === null || dueOn === today || dueOn === tomorrow)) setDueOn(addDays(today, 7))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (t && !dateProblem) onSubmit({ title: t, icon, difficulty, dueOn })
  }

  const CHOICES: { id: DueChoice; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'date', label: 'Pick date' },
    { id: 'none', label: 'No date' },
  ]

  return (
    <form onSubmit={submit} className="space-y-3.5 roomy:space-y-5">
      <TitleField label="Task" placeholder="e.g. Book a dentist appointment" value={title} onChange={setTitle} isNew={!initial} />
      <IconPicker value={icon} onChange={setIcon} />
      <DifficultyPicker value={difficulty} onChange={setDifficulty} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-muted">Due</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              aria-pressed={choice === c.id}
              className={`whitespace-nowrap rounded-xl border px-1 py-2 text-sm font-semibold transition ${choice === c.id ? 'border-primary bg-primary/15 text-ink' : 'border-line text-muted hover:border-faint'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {choice === 'date' && (
          <input
            type="date"
            aria-label="Due date"
            required
            min={range.min}
            max={range.max}
            value={dueOn ?? ''}
            onChange={(e) => setDueOn(e.target.value || null)}
            aria-invalid={!!dateProblem}
            aria-describedby={dateProblem ? 'due-date-problem' : undefined}
            className={`mt-2 w-full rounded-xl border bg-bg px-3 py-2 [color-scheme:dark] outline-none focus:border-primary ${dateProblem ? 'border-danger' : 'border-line'}`}
          />
        )}
        {choice === 'date' && dateProblem && (
          <p id="due-date-problem" role="alert" className="mt-1.5 text-xs text-danger">
            {dateProblem}
          </p>
        )}
        <p className="mt-2 hidden text-xs text-faint roomy:block">Done once for its XP. No streak to keep, and no penalty if it runs late.</p>
      </fieldset>

      <SubmitButton disabled={!!busy || !title.trim() || (choice === 'date' && !dueOn) || !!dateProblem}>{initial ? 'Save changes' : 'Add task'}</SubmitButton>

      {initial && onDelete && (
        <div className="flex border-t border-line pt-3 roomy:pt-4">
          <DeleteButton onDelete={onDelete} warning={initial.completedOn ? 'Tap again — removes its XP' : 'Tap again to delete'} />
        </div>
      )}
    </form>
  )
}
