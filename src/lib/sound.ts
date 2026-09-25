/**
 * Tiny synthesized sound effects via the Web Audio API — no audio files to ship.
 */

const MUTE_KEY = 'questlog-muted'
let ctx: AudioContext | null = null

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function audio(): AudioContext | null {
  if (isMuted()) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'triangle', gain = 0.18) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

/** Bright two-note "ding" for a completed habit. Pitch rises with streak. */
export function playComplete(streak = 0) {
  const lift = Math.min(streak, 10) * 0.03
  tone(660 * (1 + lift), 0, 0.15)
  tone(990 * (1 + lift), 0.08, 0.28)
}

export function playUndo() {
  tone(440, 0, 0.12, 'sine', 0.1)
  tone(330, 0.07, 0.18, 'sine', 0.1)
}

/** Rising fanfare for levelling up. */
export function playLevelUp() {
  ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.35, 'square', 0.08))
  tone(1319, 0.45, 0.7, 'triangle', 0.15)
}

/** Fiery "whoosh" for XP flowing into the bar: a swept band of noise over a low rumble. */
export function playWhoosh() {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const dur = 0.55

  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const noise = a.createBufferSource()
  noise.buffer = buffer

  const band = a.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 1.2
  band.frequency.setValueAtTime(300, t)
  band.frequency.exponentialRampToValueAtTime(2400, t + 0.22)
  band.frequency.exponentialRampToValueAtTime(500, t + dur)

  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.12)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  noise.connect(band).connect(g).connect(a.destination)
  noise.start(t)
  noise.stop(t + dur)

  tone(90, 0, 0.4, 'sine', 0.12)
}

/** Sparkly arpeggio for a new badge. */
export function playBadge() {
  ;[1175, 1397, 1760, 2093].forEach((f, i) => tone(f, i * 0.06, 0.25, 'sine', 0.1))
}
