import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, Check, ChevronDown, Pencil } from 'lucide-react'
import { useRef, useState } from 'react'
import { useToggleTask } from '../data/queries'
import { daysLate, taskStatus, todayTasks, upcomingTasks, xpForTask } from '../game/tasks'
import { burstFrom } from '../lib/confetti'
import { addDays, formatDay } from '../lib/dates'
import { DIFF_STYLE } from '../lib/difficulty'
import { playComplete, playUndo } from '../lib/sound'
import type { Task } from '../lib/types'

interface Props {
  tasks: Task[]
  today: string
  onEdit: (task: Task) => void
  onError: (message: string) => void
}

/** One-off tasks for today: overdue, due today and undated, plus ones finished today. */
export function TodayTasks({ tasks, today, onEdit, onError }: Props) {
  const list = todayTasks(tasks, today)
  if (list.length === 0) return null
  const open = list.filter((t) => !t.completedOn).length
  return (
    <section aria-label="Tasks" className="space-y-2">
      <h2 className="flex items-baseline gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
        Tasks <span className="font-normal normal-case tracking-normal text-faint">{open > 0 ? `${open} to do` : 'all done'}</span>
      </h2>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {list.map((t) => (
            <TaskRow key={t.id} task={t} today={today} onEdit={() => onEdit(t)} onError={onError} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}

/** Open tasks due after today, tucked into a collapsible list. */
export function UpcomingTasks({ tasks, today, onEdit, onError }: Props) {
  const [open, setOpen] = useState(false)
  const list = upcomingTasks(tasks, today)
  if (list.length === 0) return null
  return (
    <section className="sun-panel rounded-2xl border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted transition hover:text-ink"
      >
        <span>
          Upcoming tasks <span className="text-faint">· {list.length}</span>
        </span>
        <ChevronDown size={18} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="space-y-2 border-t border-line p-3">
          {list.map((t) => (
            <TaskRow key={t.id} task={t} today={today} onEdit={() => onEdit(t)} onError={onError} />
          ))}
        </ul>
      )}
    </section>
  )
}

function dueLabel(task: Task, today: string): { text: string; tone: string } {
  switch (taskStatus(task, today)) {
    case 'overdue': {
      const n = daysLate(task, today)
      return { text: `${n} day${n === 1 ? '' : 's'} late`, tone: 'text-danger' }
    }
    case 'today':
      return { text: 'Due today', tone: 'text-primary-soft' }
    case 'upcoming':
      return {
        text: task.dueOn === addDays(today, 1) ? 'Tomorrow' : formatDay(task.dueOn!, { weekday: 'short', day: 'numeric', month: 'short' }),
        tone: 'text-muted',
      }
    case 'someday':
      return { text: 'No date', tone: 'text-faint' }
    case 'done':
      return { text: 'Done', tone: 'text-done' }
  }
}

function TaskRow({ task, today, onEdit, onError }: { task: Task; today: string; onEdit: () => void; onError: (m: string) => void }) {
  const toggle = useToggleTask()
  const btn = useRef<HTMLButtonElement>(null)
  const done = task.completedOn !== null
  const xp = done ? task.xpEarned : xpForTask(task.difficulty)
  const due = dueLabel(task, today)

  function tick() {
    if (done) {
      playUndo()
      toggle.mutate({ type: 'reopen', id: task.id }, { onError: () => onError("Couldn't undo that task") })
      return
    }
    playComplete()
    burstFrom(btn.current, task.difficulty === 'hard' ? 1.2 : 0.7)
    navigator.vibrate?.(20)
    toggle.mutate({ type: 'complete', id: task.id, day: today, xp }, { onError: () => onError("Couldn't save that task") })
  }

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className={`group flex items-center gap-3 rounded-2xl border p-2.5 transition-colors sm:p-3 ${done ? 'sun-panel-done border-done/40' : 'sun-panel border-line hover:border-primary-soft/50'}`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-xl ${done ? 'bg-done/15' : 'bg-surface-2'}`} aria-hidden>
        {task.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate font-semibold ${done ? 'text-muted line-through decoration-done/60' : ''}`}>{task.title}</p>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-md p-1 text-faint transition hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Edit ${task.title}`}
          >
            <Pencil size={13} />
          </button>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className={`rounded-full px-1.5 py-px font-semibold capitalize ${DIFF_STYLE[task.difficulty]}`}>{task.difficulty}</span>
          <span className={`flex items-center gap-1 font-medium ${due.tone}`}>
            {!done && <CalendarClock size={12} aria-hidden />} {due.text}
          </span>
        </p>
      </div>
      <span className={`shrink-0 text-sm font-bold ${done ? 'text-done' : 'text-xp'}`}>+{xp} XP</span>
      <button
        ref={btn}
        type="button"
        onClick={tick}
        aria-pressed={done}
        aria-label={done ? `Undo ${task.title}` : `Complete task ${task.title} for ${xp} XP`}
        className={`grid size-10 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
          done ? 'border-done bg-done text-bg hover:brightness-110' : 'border-faint text-transparent hover:border-done hover:text-done/50'
        }`}
      >
        <Check size={20} strokeWidth={3.5} />
      </button>
    </motion.li>
  )
}
