import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BURN_CELL, BURN_MS, NOTIFICATION_MS, burnFront, burnOrder, burnState, edgeColor, scorchColor } from '../lib/burn'
import { emberSparks } from '../lib/celebrate'
import { spark } from '../lib/embers'
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
  const reduced = useReducedMotion()
  // Notifications burning away right now; each is removed once its burn finishes.
  const [burning, setBurning] = useState<ReadonlySet<string>>(new Set())
  const burnAway = useCallback(
    (id: string) => (reduced ? dismiss(id) : setBurning((b) => new Set(b).add(id))),
    [reduced, dismiss],
  )
  const burnt = useCallback(
    (id: string) => {
      setBurning((b) => {
        const next = new Set(b)
        next.delete(id)
        return next
      })
      dismiss(id)
    },
    [dismiss],
  )

  // Each notification lasts NOTIFICATION_MS in all, oldest first: it starts burning BURN_MS before
  // the end (with reduced motion there's no burn, so it simply goes at the end).
  const next = toasts.find((t) => !burning.has(t.id))
  useEffect(() => {
    if (!next) return
    const t = setTimeout(() => burnAway(next.id), reduced ? NOTIFICATION_MS : NOTIFICATION_MS - BURN_MS)
    return () => clearTimeout(t)
  }, [next, burnAway, reduced])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.slice(0, 3).map((t) => (
          <BurningToast key={t.id} toast={t} burning={burning.has(t.id)} onDismiss={() => burnAway(t.id)} onBurnt={() => burnt(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * One notification. When it's dismissed it burns away like a scroll held over a flame: a ragged,
 * glowing edge climbs from the bottom, scorching the paper ahead of it and throwing off sparks,
 * until nothing is left. The burn is worked out on a small canvas and applied as a mask, so the
 * real notification underneath is what burns.
 */
function BurningToast({ toast: t, burning, onDismiss, onBurnt }: { toast: Toast; burning: boolean; onDismiss: () => void; onBurnt: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLCanvasElement>(null)
  // The latest "burnt" callback, without restarting a burn that's under way when it changes.
  const done = useRef(onBurnt)
  useEffect(() => {
    done.current = onBurnt
  })

  useEffect(() => {
    const el = box.current
    const overlay = glow.current
    if (!burning || !el || !overlay) return
    const rect = el.getBoundingClientRect()
    const cols = Math.max(1, Math.ceil(rect.width / BURN_CELL))
    const rows = Math.max(1, Math.ceil(rect.height / BURN_CELL))
    const order = burnOrder(cols, rows)
    overlay.width = cols
    overlay.height = rows
    const mask = document.createElement('canvas')
    mask.width = cols
    mask.height = rows
    const oc = overlay.getContext('2d')
    const mc = mask.getContext('2d')
    if (!oc || !mc) return done.current()
    const glowPixels = oc.createImageData(cols, rows)
    const maskPixels = mc.createImageData(cols, rows)
    let start = 0
    let raf = 0

    const frame = (now: number) => {
      start ||= now
      const progress = Math.min((now - start) / BURN_MS, 1)
      const front = burnFront(progress)
      const g = glowPixels.data
      const m = maskPixels.data
      const edge: number[] = []
      for (let i = 0; i < order.length; i++) {
        const k = i * 4
        const state = burnState(order[i], front)
        m[k + 3] = state.kind === 'gone' ? 0 : 255
        if (state.kind === 'edge') {
          ;[g[k], g[k + 1], g[k + 2]] = edgeColor(state.heat)
          g[k + 3] = 255
          edge.push(i)
        } else if (state.kind === 'scorch') {
          const [r, gr, b, a] = scorchColor(state.amount)
          ;[g[k], g[k + 1], g[k + 2], g[k + 3]] = [r, gr, b, Math.round(a * 255)]
        } else {
          g[k + 3] = 0
        }
      }
      oc.putImageData(glowPixels, 0, 0)
      mc.putImageData(maskPixels, 0, 0)
      const url = `url(${mask.toDataURL()})`
      el.style.setProperty('mask-image', url)
      el.style.setProperty('-webkit-mask-image', url)
      // A couple of sparks flick off the burning edge each frame.
      const sparks = []
      for (let n = 0; n < 2 && edge.length; n++) {
        const i = edge[Math.floor(Math.random() * edge.length)]
        sparks.push(spark(rect.left + (i % cols) * BURN_CELL, rect.top + Math.floor(i / cols) * BURN_CELL))
      }
      emberSparks(sparks)
      if (progress < 1) raf = requestAnimationFrame(frame)
      else done.current()
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [burning])

  return (
    <motion.div
      ref={box}
      layout
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}
      className={`pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border bg-surface-2 p-3 shadow-xl ${toneClass[t.tone]}`}
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
      <button onClick={onDismiss} disabled={burning} className="rounded-lg p-1 text-faint hover:text-ink" aria-label="Dismiss">
        <X size={16} />
      </button>
      {/* The glowing edge and scorch, drawn over the notification while it burns. */}
      <canvas ref={glow} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
    </motion.div>
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
            className="sun-card relative w-full max-w-sm overflow-hidden rounded-3xl border border-sun-crimson/50 p-8 text-center"
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-xp">Level up!</p>
              {/* The new flame badge, rising up from its base with a bounce */}
              <div className="relative my-5 flex items-end justify-center" style={{ height: levelFlame(level).height * LEVEL_UP_SCALE }}>
                {/* Sun rays turning slowly behind the flame, over a breathing ember glow. Both fade out
                    well before the card's edges. */}
                <div aria-hidden className="levelup-glow" />
                <div aria-hidden className="levelup-rays" />
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
