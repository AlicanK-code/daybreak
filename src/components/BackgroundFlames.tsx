import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useReducedMotion } from 'motion/react'
import { risingFlecks } from '../lib/flames'
import { FIRE_PALETTE, createFire, paintFire, stepFire, type Fire } from '../lib/pixelFire'

/** On-screen size of one fire pixel, in CSS pixels. Big and square, like a block game. */
const CELL = 12
/** Rows of fire; the flames burn out about two-thirds of the way up. */
const ROWS = 30
/** Choppy on purpose, like block-game animation, and cheap to run. */
const FPS = 12
/** Steps to run before the first paint, so the fire starts fully lit rather than growing in. */
const WARM_UP = 40

// Sprite colours, taken from the fire's own palette: [hot pixel, cooler pixel] for orange, red, gold.
const TONES: [string, string][] = [
  [rgb(FIRE_PALETTE[8]), rgb(FIRE_PALETTE[6])],
  [rgb(FIRE_PALETTE[6]), rgb(FIRE_PALETTE[4])],
  [rgb(FIRE_PALETTE[10]), rgb(FIRE_PALETTE[8])],
]
// Tiny pixel clusters, as [x, y, hot] cells on a 2×3 grid: a lone spark, a rising pair, an L and a
// broken diagonal. The hot cell is the brightest, like the top of a burning pixel.
const SPRITES: [number, number, boolean][][] = [
  [[0, 0, true]],
  [
    [0, 0, true],
    [0, 1, false],
  ],
  [
    [0, 0, true],
    [0, 1, false],
    [1, 1, false],
  ],
  [
    [1, 0, true],
    [0, 1, false],
    [1, 2, false],
  ],
]

function rgb([r, g, b]: readonly number[]) {
  return `rgb(${r} ${g} ${b})`
}

/**
 * Pixel fire burning along the bottom of the screen behind the whole app, with little pixel sprites
 * of fire drifting up out of it. Purely decorative: fixed behind all content and never interactive.
 * With reduced motion it shows a single still frame of fire and no drifting sprites.
 */
export function BackgroundFlames() {
  const reduced = useReducedMotion()
  const flecks = useMemo(() => risingFlecks(), [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-flame-glow absolute inset-x-0 bottom-0 h-[30vh]" />
      <div className="bg-flames absolute inset-0">
        <PixelFire animate={!reduced} />
        {!reduced &&
          flecks.map((f, i) => (
            <svg
              key={i}
              viewBox="0 0 2 3"
              shapeRendering="crispEdges"
              className="bg-fleck absolute bottom-[-2vh]"
              style={
                {
                  left: `${f.left}%`,
                  width: f.size * 2,
                  height: f.size * 3,
                  animationDuration: `${f.duration}s`,
                  animationDelay: `${f.delay}s`,
                  '--drift': `${f.drift}vw`,
                } as CSSProperties
              }
            >
              {SPRITES[f.sprite].map(([x, y, hot]) => (
                <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill={TONES[f.tone][hot ? 0 : 1]} />
              ))}
            </svg>
          ))}
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
    const draw = () => {
      paintFire(fire, image.data)
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
      for (let i = 0; i < WARM_UP; i++) stepFire(fire)
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
