import confetti from 'canvas-confetti'

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Fire palette: gold, amber, orange, flame red and white-hot sparks.
const COLORS = ['#fbbf24', '#ffb347', '#ff7a1a', '#ff2a1f', '#fef3c7']

/** Small burst from a point on screen (e.g. the button that was clicked). */
export function burstFrom(el: Element | null, intensity = 1) {
  if (reduced()) return
  const r = el?.getBoundingClientRect()
  const origin = r
    ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
    : { x: 0.5, y: 0.6 }
  confetti({
    particleCount: Math.round(40 * intensity),
    spread: 70,
    startVelocity: 28,
    ticks: 120,
    scalar: 0.9,
    origin,
    colors: COLORS,
    disableForReducedMotion: true,
  })
}

/** Full-screen celebration for level-ups and perfect days. */
export function bigCelebration() {
  if (reduced()) return
  const end = Date.now() + 1200
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
