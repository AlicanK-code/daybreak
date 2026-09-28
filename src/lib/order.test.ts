import { describe, expect, it } from 'vitest'
import type { Difficulty } from './types'
import { applyOrder, moveItem, orderHabits } from './order'

describe('moveItem', () => {
  it('moves an item down and up', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('clamps moves past either end', () => {
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
    expect(moveItem(['a', 'b', 'c'], 2, 5)).toEqual(['a', 'b', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 9)).toEqual(['a', 'c', 'b'])
  })

  it('ignores an unknown starting index and never mutates the input', () => {
    const items = ['a', 'b']
    expect(moveItem(items, 5, 0)).toEqual(['a', 'b'])
    moveItem(items, 0, 1)
    expect(items).toEqual(['a', 'b'])
  })
})

describe('applyOrder', () => {
  const h = (id: string, sortOrder: number) => ({ id, sortOrder })

  it('renumbers listed items in the given order', () => {
    const out = applyOrder([h('a', 0), h('b', 1), h('c', 2)], ['c', 'a', 'b'])
    expect(out).toEqual([h('c', 0), h('a', 1), h('b', 2)])
  })

  it('keeps unlisted items (e.g. archived) after the listed ones, untouched', () => {
    const out = applyOrder([h('a', 0), h('old', 7), h('b', 1)], ['b', 'a'])
    expect(out).toEqual([h('b', 0), h('a', 1), h('old', 7)])
  })
})

describe('orderHabits', () => {
  let n = 0
  let ids = 0
  const habit = (title: string, difficulty: Difficulty, priority: boolean, sortOrder = n++) => ({ id: `h${ids++}`, title, difficulty, priority, sortOrder })
  const titles = (hs: { title: string }[]) => hs.map((h) => h.title)

  it('puts priority habits first, hardest first', () => {
    const out = orderHabits([
      habit('Plan', 'easy', false),
      habit('Water', 'easy', true),
      habit('Read', 'medium', true),
      habit('Run', 'hard', false),
      habit('Code', 'hard', true),
    ])
    expect(titles(out)).toEqual(['Code', 'Read', 'Water', 'Plan', 'Run'])
  })

  it('orders priority habits of the same difficulty alphabetically, ignoring case', () => {
    const out = orderHabits([habit('workout', 'hard', true), habit('Code', 'hard', true), habit('boxing', 'hard', true)])
    expect(titles(out)).toEqual(['boxing', 'Code', 'workout'])
  })

  it('compares numbers in titles by value', () => {
    const out = orderHabits([habit('Habit 10', 'easy', true), habit('Habit 2', 'easy', true)])
    expect(titles(out)).toEqual(['Habit 2', 'Habit 10'])
  })

  it("keeps everything else in the player's own order", () => {
    const out = orderHabits([habit('C', 'hard', false, 2), habit('A', 'easy', false, 0), habit('B', 'medium', false, 1)])
    expect(titles(out)).toEqual(['A', 'B', 'C'])
  })

  it("ignores a priority habit's drag position", () => {
    const out = orderHabits([habit('Zebra', 'hard', true, 0), habit('Apple', 'hard', true, 5)])
    expect(titles(out)).toEqual(['Apple', 'Zebra'])
  })

  it('sinks finished habits to the bottom, keeping the same order among them', () => {
    const hs = [
      habit('Code', 'hard', true),
      habit('Read', 'medium', true),
      habit('Plan', 'easy', false, 0),
      habit('Water', 'easy', false, 1),
      habit('Run', 'hard', false, 2),
    ]
    const done = new Set([hs[0].id, hs[3].id]) // Code (priority) and Water
    expect(titles(orderHabits(hs, done))).toEqual(['Read', 'Plan', 'Run', 'Code', 'Water'])
  })

  it('keeps the usual order when nothing is finished, or everything is', () => {
    const hs = [habit('B', 'easy', false, 1), habit('A', 'hard', true), habit('C', 'easy', false, 0)]
    expect(titles(orderHabits(hs))).toEqual(['A', 'C', 'B'])
    expect(titles(orderHabits(hs, new Set(hs.map((h) => h.id))))).toEqual(['A', 'C', 'B'])
  })

  it('never mutates the input', () => {
    const input = [habit('B', 'easy', true), habit('A', 'hard', true)]
    const before = titles(input)
    orderHabits(input)
    expect(titles(input)).toEqual(before)
  })
})
