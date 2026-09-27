import { describe, expect, it } from 'vitest'
import { applyOrder, moveItem } from './order'

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
