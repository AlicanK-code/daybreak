import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { levelFlame } from '../lib/levelFlame'
import { LevelBadge } from './LevelFlame'

/** The level-up popup shows the flame badge larger than on the player card. */
const LEVEL_UP_SCALE = 1.8

export interface Toast {
  id: string
  icon: string
  title: string
  body: string
  tone: 'badge' | 'perfect' | 'error'
}

const toneClass: Record<Toast['tone'], string> = {
  badge: 'border-xp/50 shadow-xp/20',
  perfect: 'border-done/50 shadow-done/20',
  error: 'border-danger/50 shadow-danger/20',
}

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  useEffect(() => {
    if (!toasts.length) return
    const t = setTimeout(() => dismiss(toasts[0].id), 4500)
    return () => clearTimeout(t)
  }, [toasts, dismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.slice(0, 3).map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-surface-2 p-3 shadow-xl ${toneClass[t.tone]}`}
          >
            <motion.span
              className="text-3xl"
              initial={{ rotate: -30, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.1 }}
            >
              {t.icon}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.tone === 'badge' ? 'Badge unlocked' : t.tone === 'perfect' ? 'Perfect day' : 'Something went wrong'}
              </p>
              <p className="font-bold">{t.title}</p>
              <p className="text-sm text-muted">{t.body}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-faint hover:text-ink" aria-label="Dismiss">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function LevelUpModal({ level, title, onClose }: { level: number | null; title: string; onClose: () => void }) {
  useEffect(() => {
    if (level === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [level, onClose])

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="levelup-title"
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-xp/40 bg-surface p-8 text-center shadow-2xl shadow-xp/20"
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 -z-0 opacity-40"
              style={{ background: 'conic-gradient(from 0deg, transparent, rgb(251 191 36 / 0.35), transparent 30%)' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            />
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-xp">Level up!</p>
              {/* The new flame badge, rising up from its base with a bounce */}
              <div className="my-5 flex items-end justify-center" style={{ height: levelFlame(level).height * LEVEL_UP_SCALE }}>
                <motion.div
                  className="origin-bottom"
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: LEVEL_UP_SCALE, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
                >
                  <LevelBadge level={level} />
                </motion.div>
              </div>
              <h2 id="levelup-title" className="text-2xl font-extrabold">
                You reached level {level}
              </h2>
              <p className="mt-1 text-muted">
                Rank: <span className="font-semibold text-primary-soft">{title}</span>
              </p>
              <button
                autoFocus
                onClick={onClose}
                className="mt-6 w-full rounded-xl bg-xp py-3 font-bold text-bg transition hover:brightness-110 active:scale-[0.98]"
              >
                Onward!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
