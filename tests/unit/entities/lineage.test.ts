import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { lineageOf, type LineageDepth } from '@/core/entities/lineage'
import { memberId } from '@tests/support/family-fixtures'
import { extendedFamily, person, unionOf } from '@tests/support/family-builder'

const family = extendedFamily()

function lineage(pivot: string, depth: LineageDepth, source = family) {
  return lineageOf(source, memberId(pivot), depth)
}

const generations = (pivot: string, depth: LineageDepth, source = family) =>
  Object.fromEntries(lineage(pivot, depth, source).relativeGenerations)

describe('lineageOf', () => {
  it('keeps descendants down to the requested depth', () => {
    expect(generations('grandpa', { ancestors: 0, descendants: 1 })).toEqual({
      grandpa: 0,
      grandma: 0,
      dad: 1,
      aunt: 1,
    })
  })

  it('keeps ancestors up to the requested depth', () => {
    expect(generations('me', { ancestors: 2, descendants: 0 })).toEqual({
      me: 0,
      dad: -1,
      mum: -1,
      grandpa: -2,
      grandma: -2,
      granny2: -2,
    })
  })

  it('adds co-parents who share a visible child', () => {
    expect(generations('dad', { ancestors: 0, descendants: 1 })).toEqual({
      dad: 0,
      mum: 0,
      other: 0,
      me: 1,
      sister: 1,
      half: 1,
    })
  })

  it('leaves out a partner without a visible child', () => {
    const couple = Family.of([person('a'), person('b')], [unionOf('u', ['a', 'b'], [])])

    expect(generations('a', { ancestors: 1, descendants: 4 }, couple)).toEqual({ a: 0 })
  })

  it('keeps unions with a visible parent and a visible child only', () => {
    const { unionIds } = lineage('dad', { ancestors: 1, descendants: 0 })

    expect([...unionIds]).toEqual(['u_grand'])
  })

  it('reports whether the pivot has descendants and the deepest shown', () => {
    const withChildren = lineage('grandpa', { ancestors: 0, descendants: 4 })
    const childless = lineage('cousin', { ancestors: 0, descendants: 4 })

    expect([withChildren.hasDescendants, withChildren.deepestDescendantShown]).toEqual([true, 2])
    expect([childless.hasDescendants, childless.deepestDescendantShown]).toEqual([false, 0])
  })

  it('terminates on a cyclic family', () => {
    const cyclic = Family.of(
      [person('a'), person('b')],
      [unionOf('u1', ['a'], ['b']), unionOf('u2', ['b'], ['a'])],
    )

    expect(generations('a', { ancestors: 5, descendants: 5 }, cyclic)).toEqual({ a: 0, b: 1 })
  })
})
