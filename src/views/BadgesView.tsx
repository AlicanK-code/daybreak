import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { BADGES, type Tier } from '../game/badges'
import type { Progress } from '../game/progress'

const TIER: Record<Tier, { ring: string; label: string; text: string }> = {
  bronze: { ring: 'ring-[#cd7f32]/60', label: 'Bronze', text: 'text-[#e0a36a]' },
  silver: { ring: 'ring-[#c7c9dc]/60', label: 'Silver', text: 'text-[#c7c9dc]' },
  gold: { ring: 'ring-xp/70', label: 'Gold', text: 'text-xp' },
}

export function BadgesView({ progress }: { progress: Progress }) {
  const items = BADGES.map((b) => ({ ...b, pct: b.progress(progress) }))
  const unlocked = items.filter((b) => b.pct >= 1).length

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">Trophy cabinet</h2>
          <p className="text-sm text-muted">
            <span className="font-bold text-xp">{unlocked}</span> / {items.length} unlocked
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
          <motion.div className="h-full rounded-full bg-xp" initial={{ width: 0 }} animate={{ width: `${(unlocked / items.length) * 100}%` }} />
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((b, i) => {
          const got = b.pct >= 1
          const tier = TIER[b.tier]
          return (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex flex-col items-center rounded-2xl border p-4 text-center ${got ? 'border-line bg-surface' : 'border-line/60 bg-surface/50'}`}
            >
              <div
                className={`relative mb-2 grid size-16 place-items-center rounded-full text-3xl ring-2 ${got ? `bg-surface-2 ${tier.ring}` : 'bg-bg ring-line grayscale'}`}
              >
                <span className={got ? '' : 'opacity-30'}>{b.icon}</span>
                {!got && <Lock size={16} className="absolute -bottom-1 -right-1 rounded-full bg-surface-2 p-0.5 text-faint" />}
              </div>
              <p className={`text-sm font-bold ${got ? '' : 'text-muted'}`}>{b.name}</p>
              <p className="mt-0.5 text-xs text-muted">{b.description}</p>
              <p className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${got ? tier.text : 'text-faint'}`}>{tier.label}</p>
              {!got && (
                <div className="mt-2 w-full">
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${b.pct * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] tabular-nums text-faint">{Math.round(b.pct * 100)}%</p>
                </div>
              )}
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
