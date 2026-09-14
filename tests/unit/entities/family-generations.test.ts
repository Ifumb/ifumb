import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { generationsOf } from '@/core/entities/family-generations'
import type { Union } from '@/core/entities/union'
import { aMember, aUnion, memberId } from '@tests/support/family-fixtures'

function unionOf(id: string, parents: readonly string[], children: readonly string[]): Union {
  const [parent1, parent2] = parents
  return aUnion({
    id,
    parent1Id: parent1 ? memberId(parent1) : null,
    parent2Id: parent2 ? memberId(parent2) : null,
    children: children.map((child) => ({ childId: memberId(child), filiation: 'BIOLOGICAL' })),
  })
}

function generations(memberIds: readonly string[], unions: readonly Union[]) {
  const members = memberIds.map((id) => aMember({ id: memberId(id), firstName: id }))
  return Object.fromEntries(generationsOf(Family.of(members, unions)))
}

describe('generationsOf', () => {
  it('puts members without parents at generation 0', () => {
    expect(generations(['a', 'b'], [])).toEqual({ a: 0, b: 0 })
  })

  it('puts a child one generation below its parents', () => {
    expect(generations(['p1', 'p2', 'c'], [unionOf('u', ['p1', 'p2'], ['c'])])).toEqual({
      p1: 0,
      p2: 0,
      c: 1,
    })
  })

  it('keeps the deepest generation when a member descends from several levels', () => {
    const unions = [
      unionOf('u1', ['g'], ['p']),
      unionOf('u2', ['p'], ['c']),
      unionOf('u3', ['r'], ['c']),
    ]

    expect(generations(['g', 'p', 'r', 'c'], unions)).toEqual({ g: 0, p: 1, r: 0, c: 2 })
  })

  it('aligns partners of a union on the deeper generation', () => {
    const unions = [unionOf('u1', ['g'], ['p']), unionOf('u2', ['p', 'spouse'], ['c'])]

    expect(generations(['g', 'p', 'spouse', 'c'], unions)).toMatchObject({ p: 1, spouse: 1 })
  })

  it('handles a union with a single parent', () => {
    expect(generations(['p', 'c'], [unionOf('u', ['p'], ['c'])])).toEqual({ p: 0, c: 1 })
  })

  it('ignores children that are not members of the family', () => {
    expect(generations(['p'], [unionOf('u', ['p'], ['ghost'])])).toEqual({ p: 0 })
  })

  it('terminates on a cyclic family', () => {
    const unions = [
      unionOf('u1', ['root'], ['a']),
      unionOf('u2', ['a'], ['b']),
      unionOf('u3', ['b'], ['a']),
    ]

    const result = generations(['root', 'a', 'b'], unions)

    expect(Math.max(...Object.values(result))).toBeLessThanOrEqual(2)
  })

  it('puts members only reachable through a cycle at generation 0', () => {
    const unions = [unionOf('u1', ['a'], ['b']), unionOf('u2', ['b'], ['a'])]

    expect(generations(['a', 'b'], unions)).toEqual({ a: 0, b: 0 })
  })
})
