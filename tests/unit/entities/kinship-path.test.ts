import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { shortestKinshipPath } from '@/core/entities/kinship-path'
import { memberId } from '@tests/support/family-fixtures'
import { extendedFamily, person, unionOf } from '@tests/support/family-builder'

function pathBetween(family: Family, from: string, to: string) {
  return shortestKinshipPath(family, memberId(from), memberId(to))
}

const kindsAndMembers = (family: Family, from: string, to: string) =>
  pathBetween(family, from, to)?.steps.map((step) => `${step.kind}:${step.memberId}`)

describe('shortestKinshipPath', () => {
  const family = extendedFamily()

  it('finds no path between members of unrelated families', () => {
    const strangers = Family.of([person('a'), person('b')], [])

    expect(pathBetween(strangers, 'a', 'b')).toBeNull()
  })

  it('goes up from a child to a parent through their union', () => {
    expect(pathBetween(family, 'me', 'dad')?.steps).toEqual([
      { kind: 'UP', unionId: 'u_parents', memberId: 'dad' },
    ])
  })

  it('goes down from a parent to a child', () => {
    expect(kindsAndMembers(family, 'grandma', 'me')).toEqual(['DOWN:dad', 'DOWN:me'])
  })

  it('crosses a union from one child to a sibling in one step', () => {
    expect(kindsAndMembers(family, 'me', 'sister')).toEqual(['SIBLING:sister'])
  })

  it('crosses a union from one partner to the other in one step', () => {
    expect(pathBetween(family, 'dad', 'mum')?.steps).toEqual([
      { kind: 'PARTNER', unionId: 'u_parents', memberId: 'mum' },
    ])
  })

  it('returns the shortest path when several exist', () => {
    expect(kindsAndMembers(family, 'me', 'cousin')).toEqual([
      'UP:dad',
      'SIBLING:aunt',
      'DOWN:cousin',
    ])
  })

  it('ignores links towards people who are not members of the family', () => {
    const family = Family.of([person('a')], [unionOf('u', ['a'], ['ghost'])])

    expect(pathBetween(family, 'a', 'ghost')).toBeNull()
  })

  it('terminates on a cyclic family', () => {
    const cyclic = Family.of(
      [person('a'), person('b'), person('c')],
      [unionOf('u1', ['a'], ['b']), unionOf('u2', ['b'], ['a'])],
    )

    expect(pathBetween(cyclic, 'a', 'c')).toBeNull()
  })
})
