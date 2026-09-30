import { titleForLevel, xpToReachLevel } from '../game/xp'
import { FLAME_MAX_LEVEL, flameStages, levelFlame, stageIndexFor } from '../lib/levelFlame'
import { LevelBadge } from './LevelFlame'
import { Modal } from './Modal'

const STAGES = flameStages()
// Every cell is as tall as the biggest flame, so all the flames stand on the same line.
const CELL_FLAME_HEIGHT = levelFlame(FLAME_MAX_LEVEL).height

/** A dialog showing the flame at each rank it passes through, with the player's stage highlighted. */
export function LevelFlames({ open, level, onClose }: { open: boolean; level: number; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} centered title="Level flames">
      {open && <LevelFlamesBody level={level} />}
    </Modal>
  )
}

function LevelFlamesBody({ level }: { level: number }) {
  const yours = stageIndexFor(level, STAGES)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Your flame grows and burns fiercer with every level. Here's how it looks at each rank, up to full blaze at level {FLAME_MAX_LEVEL}.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage, i) => {
          const isYou = i === yours
          const reached = i <= yours
          const range = stage.to === null ? `Lv ${stage.from}+` : stage.to === stage.from ? `Lv ${stage.from}` : `Lv ${stage.from}–${stage.to}`
          return (
            <li
              key={stage.from}
              aria-current={isYou ? 'true' : undefined}
              className={`relative flex flex-col items-center rounded-xl border px-1 pt-2 pb-2 text-center ${
                isYou ? 'border-sun-blaze-orange/60 bg-sun-crimson/15' : 'border-line'
              } ${reached ? '' : 'opacity-45'}`}
            >
              {isYou && (
                <span className="absolute top-1 right-1 rounded-full bg-sun-blaze-orange px-1.5 text-[10px] font-bold text-sun-outline">
                  You · Lv {level}
                </span>
              )}
              <div className="flex items-end justify-center" style={{ height: CELL_FLAME_HEIGHT }}>
                <LevelBadge level={stage.from} animate={isYou} />
              </div>
              <p className="mt-1.5 text-sm font-semibold">{stage.to === null ? 'Full blaze' : titleForLevel(stage.from)}</p>
              <p className="text-[11px] text-muted">{range}</p>
              <p className="text-[10px] text-faint tabular-nums">{xpToReachLevel(stage.from).toLocaleString()} XP</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
