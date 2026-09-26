import { useState, type FormEvent } from 'react'
import { USERNAME_MAX, cleanUsername, usernameError } from '../lib/username'

export function UsernameForm({ initial, onSave }: { initial: string; onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const problem = usernameError(name)
    if (problem) return setError(problem)
    setBusy(true)
    setError(null)
    try {
      await onSave(cleanUsername(name))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your username. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Username</span>
        <input
          autoFocus
          maxLength={USERNAME_MAX + 8}
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="username-hint"
          className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-primary"
        />
        <span id="username-hint" className="mt-1.5 block text-xs text-faint">
          Shown on your player card. 2–{USERNAME_MAX} characters.
        </span>
      </label>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save username'}
      </button>
    </form>
  )
}
