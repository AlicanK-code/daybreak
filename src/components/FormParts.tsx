import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BASE_XP } from '../game/xp'
import { ICONS } from '../lib/icons'
import type { Difficulty } from '../lib/types'

/** Fields shared by the habit and task forms. */

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'easy', label: 'Easy', hint: 'Quick win' },
  { id: 'medium', label: 'Medium', hint: 'Takes effort' },
  { id: 'hard', label: 'Hard', hint: 'A real grind' },
]

// Jump straight into the title on devices with a mouse; on touch screens that would pop up the
// keyboard over the form.
const finePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

export function TitleField({
  label,
  placeholder,
  value,
  onChange,
  isNew,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  /** a new item (rather than an edit), so the field may take focus straight away */
  isNew: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <input
        autoFocus={isNew && finePointer()}
        required
        maxLength={80}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-primary"
      />
    </label>
  )
}

export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-muted">Icon</legend>
      <div className="grid grid-cols-10 gap-1">
        {ICONS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`Icon ${i}`}
            aria-pressed={value === i}
            className={`grid aspect-square place-items-center rounded-lg text-xl transition ${value === i ? 'bg-primary/25 ring-2 ring-primary' : 'hover:bg-surface-2'}`}
          >
            {i}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-muted">Difficulty</legend>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            aria-pressed={value === d.id}
            className={`rounded-xl border p-2 text-left transition roomy:p-2.5 ${value === d.id ? 'border-primary bg-primary/15' : 'border-line hover:border-faint'}`}
          >
            <span className="block font-semibold">{d.label}</span>
            <span className="hidden text-xs text-muted roomy:block">{d.hint}</span>
            <span className="block text-sm font-bold text-xp roomy:mt-1">+{BASE_XP[d.id]} XP</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function SubmitButton({ disabled, children }: { disabled: boolean; children: string }) {
  return (
    <button
      disabled={disabled}
      className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 roomy:py-3"
    >
      {children}
    </button>
  )
}

/** Delete, with a second tap to confirm. */
export function DeleteButton({ onDelete, warning }: { onDelete: () => void; warning: string }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <button
      type="button"
      onClick={() => (confirm ? onDelete() : setConfirm(true))}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-sm transition ${confirm ? 'border-danger bg-danger/15 text-danger' : 'border-line text-muted hover:text-danger'}`}
    >
      <Trash2 size={16} /> {confirm ? warning : 'Delete'}
    </button>
  )
}
