import { describe, expect, it } from 'vitest'
import { commonAncestorsOf } from '@/core/entities/common-ancestors'
import { Family } from '@/core/entities/family'
import { memberId } from '@tests/support/family-fixtures'
import { extendedFamily, person, unionOf } from '@tests/support/family-builder'

function ancestors(family: Family, a: string, b: string) {
  return commonAncestorsOf(family, memberId(a), memberId(b)).map((ancestor) => [
    ancestor.member.id.value,
    ancestor.distanceFromA,
    ancestor.distanceFromB,
  ])
}

describe('commonAncestorsOf', () => {
  const family = extendedFamily()

  it('lists ancestors shared by both members with their distances', () => {
    expect(ancestors(family, 'me', 'cousin')).toEqual([
      ['grandma', 2, 2],
      ['grandpa', 2, 2],
    ])
  })

  it('excludes the two members themselves', () => {
    expect(ancestors(family, 'dad', 'me')).toEqual([
      ['grandma', 1, 2],
      ['grandpa', 1, 2],
    ])
  })

  it('sorts by the nearest distance, then by name', () => {
    expect(ancestors(family, 'me', 'aunt')).toEqual([
      ['grandma', 2, 1],
      ['grandpa', 2, 1],
    ])
    expect(ancestors(family, 'me', 'half')).toEqual([
      ['dad', 1, 1],
      ['grandma', 2, 2],
      ['grandpa', 2, 2],
    ])
  })

  it('returns none for members without shared ancestors', () => {
    expect(ancestors(family, 'me', 'uncle')).toEqual([])
  })

  it('terminates on a cyclic family', () => {
    const cyclic = Family.of(
      [person('a'), person('b'), person('c')],
      [unionOf('u1', ['a'], ['b']), unionOf('u2', ['b'], ['a', 'c'])],
    )

    expect(ancestors(cyclic, 'a', 'c')).toEqual([['b', 1, 1]])
  })
})
