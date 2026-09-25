import { BarChart3, ListChecks, LogOut, Trophy, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LevelUpModal, Toasts, type Toast } from '../components/Celebrations'
import { Logo } from '../components/Logo'
import { PlayerCard } from '../components/PlayerCard'
import { useCompletions, useHabits } from '../data/queries'
import { useSession } from '../data/RepoContext'
import { BADGES, unlockedBadgeIds } from '../game/badges'
import { computeProgress } from '../game/progress'
import { titleForLevel } from '../game/xp'
import { useToday } from '../hooks/useToday'
import { bigCelebration } from '../lib/confetti'
import { isMuted, playBadge, playLevelUp, setMuted } from '../lib/sound'
import { BadgesView } from './BadgesView'
import { TodayView } from './TodayView'

// Charts library is heavy — only load it when the Stats tab is opened.
const StatsView = lazy(() => import('./StatsView').then((m) => ({ default: m.StatsView })))

type Tab = 'today' | 'stats' | 'badges'

const TABS: { id: Tab; label: string; Icon: typeof ListChecks }[] = [
  { id: 'today', label: 'Today', Icon: ListChecks },
  { id: 'stats', label: 'Stats', Icon: BarChart3 },
  { id: 'badges', label: 'Trophies', Icon: Trophy },
]

export function Shell() {
  const session = useSession()
  const today = useToday()
  const habitsQ = useHabits()
  const completionsQ = useCompletions()
  const [tab, setTab] = useState<Tab>('today')
  const [muted, setMutedState] = useState(isMuted)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)

  const habits = useMemo(() => habitsQ.data ?? [], [habitsQ.data])
  const completions = useMemo(() => completionsQ.data ?? [], [completionsQ.data])
  const ready = habitsQ.isSuccess && completionsQ.isSuccess
  const progress = useMemo(() => computeProgress(habits, completions, today), [habits, completions, today])

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => setToasts((ts) => [...ts, { ...t, id: crypto.randomUUID() }]), [])
  const dismissToast = useCallback((id: string) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  // --- Celebration detection -------------------------------------------------
  // Compare derived progress against what we've already celebrated this session,
  // so undo → redo doesn't spam the same level-up, and first load stays quiet.
  const seen = useRef<{ maxLevel: number; badges: Set<string>; perfect: boolean } | null>(null)
  useEffect(() => {
    if (!ready) return
    const unlocked = unlockedBadgeIds(progress)
    const perfect = progress.todayTotal > 0 && progress.todayDone === progress.todayTotal
    if (!seen.current) {
      seen.current = { maxLevel: progress.level.level, badges: unlocked, perfect }
      return
    }
    const s = seen.current
    let delay = 0
    if (progress.level.level > s.maxLevel) {
      s.maxLevel = progress.level.level
      setLevelUp(progress.level.level)
      playLevelUp()
      bigCelebration()
      delay = 700
    }
    const fresh = BADGES.filter((b) => unlocked.has(b.id) && !s.badges.has(b.id))
    if (fresh.length) {
      fresh.forEach((b) => s.badges.add(b.id))
      setTimeout(() => {
        playBadge()
        fresh.forEach((b) => pushToast({ icon: b.icon, title: b.name, body: b.description, tone: 'badge' }))
      }, delay)
    }
    if (perfect && !s.perfect) {
      if (!delay) bigCelebration()
      pushToast({ icon: '🎉', title: 'All quests complete!', body: 'Every habit done today. Legendary.', tone: 'perfect' })
    }
    s.perfect = perfect
  }, [progress, ready, pushToast])

  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  const error = habitsQ.error ?? completionsQ.error

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-extrabold tracking-tight">QuestLog</span>
          {session.mode === 'demo' && (
            <span className="rounded-full bg-xp/15 px-2 py-0.5 text-xs font-semibold text-xp">Demo</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <IconButton label={muted ? 'Unmute sounds' : 'Mute sounds'} onClick={toggleMute}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </IconButton>
          <IconButton label={session.mode === 'demo' ? 'Exit demo' : 'Sign out'} onClick={session.signOut}>
            <LogOut size={18} />
          </IconButton>
        </div>
      </header>

      <PlayerCard name={session.displayName} progress={progress} />

      <nav className="sticky top-0 z-30 mt-4 py-2" aria-label="Sections">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface/90 p-1 shadow-lg shadow-bg/50 backdrop-blur" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${tab === id ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {tab === id && (
                <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-line" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <Icon size={17} className="relative" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="mt-3">
        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-danger" role="alert">
            Couldn&apos;t load your data: {error.message}
          </div>
        ) : !ready ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : tab === 'today' ? (
          <TodayView habits={habits} progress={progress} today={today} onError={(m) => pushToast({ icon: '⚠️', title: m, body: 'Your change was rolled back.', tone: 'error' })} />
        ) : tab === 'stats' ? (
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
            <StatsView habits={habits} completions={completions} progress={progress} today={today} />
          </Suspense>
        ) : (
          <BadgesView progress={progress} />
        )}
      </main>

      <Toasts toasts={toasts} dismiss={dismissToast} />
      <LevelUpModal level={levelUp} title={levelUp ? titleForLevel(levelUp) : ''} onClose={() => setLevelUp(null)} />
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded-xl p-2.5 text-muted transition hover:bg-surface hover:text-ink">
      {children}
    </button>
  )
}
