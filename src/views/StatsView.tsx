import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Progress } from '../game/progress'
import { completionRate, dailyTotals } from '../game/stats'
import { addDays, formatDay, weekday } from '../lib/dates'
import type { Completion, Habit } from '../lib/types'

interface Props {
  habits: Habit[]
  completions: Completion[]
  progress: Progress
  today: string
}

// Sequential ember ramp, dark surface → white-hot. Step 0 = no activity.
// Step 0 follows the theme's raised surface so empty days stay visible on the card.
const HEAT = ['var(--color-surface-2)', '#6b1a1a', '#b3261e', '#f0601a', '#ffb347']

export function StatsView({ habits, completions, progress, today }: Props) {
  const daily = useMemo(() => dailyTotals(completions, 30, today), [completions, today])
  const active = habits.filter((h) => !h.archivedAt)
  const xp30 = daily.reduce((s, d) => s + d.xp, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Total XP" value={progress.level.totalXp.toLocaleString()} accent="text-xp" />
        <Stat label="Completions" value={progress.totalCompletions.toLocaleString()} />
        <Stat label="Best streak" value={`${progress.bestHabitStreak}d`} accent="text-streak" />
        <Stat label="Perfect days" value={String(progress.perfectDays)} accent="text-done" />
      </div>

      <Card title="XP earned" subtitle={`Last 30 days · ${xp30.toLocaleString()} XP`}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="#3d1f25" strokeDasharray="0" />
              <XAxis
                dataKey="day"
                tickFormatter={(d: string) => formatDay(d)}
                tick={{ fill: '#b89a92', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={6}
                minTickGap={8}
              />
              <YAxis tick={{ fill: '#b89a92', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgb(255 122 26 / 0.12)' }} content={<XpTooltip />} />
              <Bar dataKey="xp" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Activity" subtitle="Last 16 weeks — brighter = more habits done">
        <Heatmap completions={completions} today={today} habitCount={Math.max(active.length, 1)} />
      </Card>

      <Card title="Habits" subtitle="Streaks and 30-day completion rate">
        {active.length === 0 ? (
          <p className="text-sm text-muted">No habits yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {active.map((h) => {
              const hp = progress.habits.get(h.id)!
              const rate = completionRate(h, completions, 30, today)
              return (
                <li key={h.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl" aria-hidden>{h.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{h.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                        <div className="h-full rounded-full bg-linear-to-r from-sun-crimson to-sun-blaze-orange" style={{ width: `${rate * 100}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs tabular-nums text-muted">{Math.round(rate * 100)}%</span>
                    </div>
                  </div>
                  <div className="w-20 text-right text-xs text-muted">
                    <p><span className="font-semibold text-ink">{hp.currentStreak}</span> now</p>
                    <p><span className="font-semibold text-ink">{hp.bestStreak}</span> best</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value, accent = 'text-ink' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="sun-panel rounded-2xl border border-line p-3.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${accent}`}>{value}</p>
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="sun-panel rounded-2xl border border-line p-4">
      <h2 className="font-bold">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-muted">{subtitle}</p>}
      {children}
    </section>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: { day: string; xp: number; count: number } }[]
}

function XpTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{formatDay(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
      <p className="font-bold text-ink">{d.xp} XP</p>
      <p className="text-muted">{d.count} habit{d.count === 1 ? '' : 's'}</p>
    </div>
  )
}

function Heatmap({ completions, today, habitCount }: { completions: Completion[]; today: string; habitCount: number }) {
  const WEEKS = 16
  const [hover, setHover] = useState<{ day: string; count: number } | null>(null)

  const { columns, counts } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of completions) counts.set(c.completedOn, (counts.get(c.completedOn) ?? 0) + 1)
    const start = addDays(today, -weekday(today) - (WEEKS - 1) * 7) // Monday, 15 weeks back
    const columns = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
    return { columns, counts }
  }, [completions, today])

  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / habitCount) * 4)))

  return (
    <div className="max-w-xl">
      <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
        <div className="mr-1 grid grid-rows-7 gap-1 text-[10px] leading-none text-faint">
          {['M', '', 'W', '', 'F', '', 'S'].map((l, i) => (
            <span key={i} className="flex items-center">{l}</span>
          ))}
        </div>
        {columns.map((week, w) => (
          <div key={w} className="grid flex-1 grid-rows-7 gap-1">
            {week.map((day) => {
              const future = day > today
              const n = counts.get(day) ?? 0
              return (
                <div
                  key={day}
                  onMouseEnter={() => !future && setHover({ day, count: n })}
                  onClick={() => !future && setHover({ day, count: n })}
                  title={future ? undefined : `${formatDay(day)}: ${n} habit${n === 1 ? '' : 's'}`}
                  className={`aspect-square rounded-[3px] ${future ? 'opacity-0' : ''} ${day === today ? 'ring-1 ring-ink/60' : ''}`}
                  style={{ backgroundColor: HEAT[level(n)] }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span aria-live="polite">
          {hover ? `${formatDay(hover.day, { weekday: 'short', day: 'numeric', month: 'short' })} · ${hover.count} habit${hover.count === 1 ? '' : 's'}` : 'Hover a day for details'}
        </span>
        <span className="flex items-center gap-1">
          Less
          {HEAT.map((c) => (
            <span key={c} className="size-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}
