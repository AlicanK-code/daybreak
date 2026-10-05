import { describe, expect, it } from 'vitest'
import { EDGE, SCORCH, burnFront, burnOrder, burnState, edgeColor, scorchColor } from './burn'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const rowAverage = (order: Float32Array, cols: number, row: number) => {
  let sum = 0
  for (let x = 0; x < cols; x++) sum += order[row * cols + x]
  return sum / cols
}

describe('notification burn', () => {
  it('burns from the bottom up, with a ragged edge', () => {
    const cols = 190
    const rows = 40
    const order = burnOrder(cols, rows, seeded(1))
    expect(rowAverage(order, cols, rows - 1)).toBeLessThan(rowAverage(order, cols, rows / 2))
    expect(rowAverage(order, cols, rows / 2)).toBeLessThan(rowAverage(order, cols, 0))
    // Ragged, not a straight line: cells in one row burn at noticeably different times.
    const middle = Array.from({ length: cols }, (_, x) => order[(rows / 2) * cols + x])
    expect(Math.max(...middle) - Math.min(...middle)).toBeGreaterThan(0.08)
  })

  it('spans exactly 0 to 1, so every burn starts and finishes on time', () => {
    const order = burnOrder(120, 30, seeded(2))
    expect(Math.min(...order)).toBe(0)
    expect(Math.max(...order)).toBe(1)
  })

  it('starts with nothing burnt and ends with everything gone', () => {
    const order = burnOrder(80, 20, seeded(3))
    const kinds = (progress: number) => new Set(Array.from(order, (o) => burnState(o, burnFront(progress)).kind))
    expect(kinds(0).has('gone')).toBe(false)
    expect([...kinds(1)]).toEqual(['gone'])
    expect(kinds(0.5)).toEqual(new Set(['gone', 'edge', 'scorch', 'paper']))
  })

  it('has a glowing edge, then scorch, then untouched paper ahead of the flames', () => {
    const front = 0.5
    expect(burnState(0.49, front)).toEqual({ kind: 'gone' })
    expect(burnState(front, front)).toEqual({ kind: 'edge', heat: 1 })
    expect(burnState(front + EDGE + 0.01, front).kind).toBe('scorch')
    expect(burnState(front + EDGE + SCORCH + 0.01, front)).toEqual({ kind: 'paper' })
  })

  it('glows an aggressive orange to red, never yellow or white', () => {
    for (const heat of [0, 0.25, 0.5, 0.75, 1]) {
      const [r, g, b] = edgeColor(heat)
      expect(r).toBeGreaterThanOrEqual(200)
      expect(g).toBeLessThanOrEqual(110)
      expect(b).toBeLessThan(30)
    }
    expect(edgeColor(1)).toEqual([255, 110, 26])
    expect(edgeColor(0)).toEqual([200, 20, 10])
  })

  it('scorches darker and redder close to the edge', () => {
    const [farR, , , farA] = scorchColor(0)
    const [nearR, , , nearA] = scorchColor(1)
    expect(nearR).toBeGreaterThan(farR)
    expect(nearA).toBeGreaterThan(farA)
  })
})
