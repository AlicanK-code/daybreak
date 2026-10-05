import { burst, emberAlpha, emberColor, emberHeat, stepEmber, storm, type Ember } from './embers'

/**
 * Draws ember celebrations on one full-screen canvas above everything (it ignores clicks). The
 * canvas is created on first use and only animates while embers are alive. Skipped entirely for
 * reduced motion.
 */

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

let canvas: HTMLCanvasElement | null = null
let embers: Ember[] = []
let running = false
let last = 0

function ensureCanvas(): CanvasRenderingContext2D | null {
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.dataset.celebration = ''
    Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '100' })
    document.body.appendChild(canvas)
  }
  // Match the screen (and its pixel density) each time, in case the window was resized.
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(window.innerWidth * dpr)
  const h = Math.round(window.innerHeight * dpr)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function draw(ctx: CanvasRenderingContext2D, e: Ember) {
  const [r, g, b] = emberColor(emberHeat(e))
  const a = emberAlpha(e)
  if (e.pixel) {
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`
    ctx.fillRect(Math.round(e.x / 2) * 2 - e.size / 2, Math.round(e.y / 2) * 2 - e.size / 2, e.size, e.size)
    return
  }
  // A short tail, the ember itself, and a faint halo around it.
  if (e.trail.length) {
    ctx.strokeStyle = `rgba(${r},${Math.max(g - 60, 0)},${b},${a * 0.5})`
    ctx.lineWidth = e.size
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(e.trail[0][0], e.trail[0][1])
    for (const [x, y] of e.trail) ctx.lineTo(x, y)
    ctx.lineTo(e.x, e.y)
    ctx.stroke()
  }
  ctx.fillStyle = `rgba(${r},${g},${b},${a})`
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.18})`
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2)
  ctx.fill()
}

function frame(now: number) {
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  // Frames at 60 fps since the last one, timed from the animation timestamps alone (the first frame
  // counts as one), and capped so a stalled tab doesn't fling embers across the screen.
  const dt = last ? Math.min(Math.max((now - last) / (1000 / 60), 0), 3) : 1
  last = now
  embers = embers.filter((e) => stepEmber(e, dt))
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'lighter' // overlapping embers glow brighter
  for (const e of embers) draw(ctx, e)
  if (embers.length) requestAnimationFrame(frame)
  else running = false
}

function launch(more: Ember[]) {
  if (!ensureCanvas()) return
  embers.push(...more)
  if (!running) {
    running = true
    last = 0
    requestAnimationFrame(frame)
  }
}

/** Sparks bursting out of an element (e.g. the button that was tapped) and floating upwards. */
export function emberBurst(el: Element | null, intensity = 1) {
  if (reduced()) return
  const r = el?.getBoundingClientRect()
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2
  const y = r ? r.top + r.height / 2 : window.innerHeight * 0.6
  launch(burst(x, y, intensity))
}

/** Extra embers made elsewhere (e.g. sparks off a burning notification), drawn with the rest. */
export function emberSparks(more: Ember[]) {
  if (reduced() || !more.length) return
  launch(more)
}

/** A wave of embers rising from the bottom of the screen, for level-ups and perfect days. */
export function emberStorm() {
  if (reduced()) return
  launch(storm(window.innerWidth, window.innerHeight))
}
