import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Flame, Sparkles, Trophy } from 'lucide-react'
import { supabase } from '../data/supabase'
import { Logo } from '../components/Logo'

export function AuthScreen({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    setInfo(null)
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    setBusy(false)
    if (error) setError(error.message)
    else if (mode === 'signup' && !data.session) setInfo('Check your inbox to confirm your email, then sign in.')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo size={56} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">QuestLog</h1>
        <p className="mt-2 text-muted">Turn your daily habits into an RPG.</p>
        <ul className="mt-5 flex justify-center gap-4 text-sm text-muted">
          <li className="flex items-center gap-1.5"><Sparkles size={16} className="text-xp" /> Earn XP</li>
          <li className="flex items-center gap-1.5"><Flame size={16} className="text-streak" /> Build streaks</li>
          <li className="flex items-center gap-1.5"><Trophy size={16} className="text-primary-soft" /> Unlock badges</li>
        </ul>
      </motion.div>

      <div className="rounded-2xl border border-line bg-surface/80 p-6 shadow-xl backdrop-blur">
        {supabase ? (
          <>
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-bg p-1 text-sm font-semibold">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2 transition ${mode === m ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-muted">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-muted">Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
              {error && <p className="text-sm text-danger" role="alert">{error}</p>}
              {info && <p className="text-sm text-done" role="status">{info}</p>}
              <button
                disabled={busy}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? 'Please wait…' : mode === 'signin' ? 'Begin your quest' : 'Create account'}
              </button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-faint">
              <div className="h-px flex-1 bg-line" /> or <div className="h-px flex-1 bg-line" />
            </div>
          </>
        ) : (
          <p className="mb-4 rounded-xl border border-xp/30 bg-xp/10 p-3 text-sm text-xp">
            Supabase isn&apos;t configured yet — add your keys to <code>.env</code> (see README). Demo mode works without it.
          </p>
        )}
        <button
          type="button"
          onClick={onDemo}
          className="w-full rounded-xl border border-line bg-surface-2 py-3 font-semibold transition hover:border-primary-soft active:scale-[0.98]"
        >
          Try the demo — no account needed
        </button>
      </div>
    </main>
  )
}
