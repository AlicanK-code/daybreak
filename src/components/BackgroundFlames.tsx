import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { createFire, paintFire, paintSparks, stepFire, stepSparks, type Fire, type Spark } from '../lib/pixelFire'

/** On-screen size of one fire pixel, in CSS pixels. Big and square, like a block game. */
const CELL = 12
/** Rows of canvas: the flames burn out in the lower part, and sparks rise into the rest. */
const ROWS = 44
/** Choppy on purpose, like block-game animation, and cheap to run. */
const FPS = 12
/** Steps to run before the first paint, so the fire starts fully lit rather than growing in. */
const WARM_UP = 40

/**
 * Pixel fire burning along the bottom of the screen behind the whole app, with sparks of fire
 * flying up out of it. Fire and sparks are drawn together on one small canvas, so the whole
 * background redraws as a single layer a few times a second, which stays cheap in every browser.
 * Purely decorative: fixed behind all content and never interactive. With reduced motion it shows a
 * single still frame.
 */
export function BackgroundFlames() {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-flame-glow absolute inset-x-0 bottom-0 h-[30vh]" />
      <div className="bg-flames absolute inset-0">
        <PixelFire animate={!reduced} />
      </div>
    </div>
  )
}

/** The fire itself: simulated at one canvas pixel per cell, then scaled up with crisp edges. */
function PixelFire({ animate }: { animate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let fire: Fire
    let image: ImageData
    const sparks: Spark[] = []
    const draw = () => {
      paintFire(fire, image.data)
      paintSparks(fire, sparks, image.data)
      ctx.putImageData(image, 0, 0)
    }
    // One column per cell across the screen; rebuilt when the window is resized. At least one
    // column: a window can report zero width (e.g. loading in the background), and a zero-width
    // canvas would throw and take the app down with it.
    const build = () => {
      const cols = Math.max(1, Math.ceil(window.innerWidth / CELL))
      canvas.width = cols
      canvas.height = ROWS
      canvas.style.width = `${cols * CELL}px`
      canvas.style.height = `${ROWS * CELL}px`
      fire = createFire(cols, ROWS)
      sparks.length = 0
      for (let i = 0; i < WARM_UP; i++) {
        stepFire(fire)
        stepSparks(fire, sparks)
      }
      image = ctx.createImageData(cols, ROWS)
      draw()
    }
    build()
    window.addEventListener('resize', build)
    if (!animate) return () => window.removeEventListener('resize', build)

    // requestAnimationFrame pauses in hidden tabs; only step the fire FPS times a second.
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (now - last < 1000 / FPS) return
      last = now
      stepFire(fire)
      stepSparks(fire, sparks)
      draw()
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', build)
    }
  }, [animate])

  return <canvas ref={canvasRef} className="absolute bottom-0 left-0 [image-rendering:pixelated]" />
}
