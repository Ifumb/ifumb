import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { classifyKinship } from '@/core/entities/kinship'
import { shortestKinshipPath } from '@/core/entities/kinship-path'
import { memberId } from '@tests/support/family-fixtures'
import { extendedFamily, person, unionOf } from '@tests/support/family-builder'

const family = extendedFamily()

function kinshipOf(from: string, to: string) {
  const path = shortestKinshipPath(family, memberId(from), memberId(to))
  if (!path) throw new Error(`No path from ${from} to ${to}`)
  return classifyKinship(path, family)
}

describe('classifyKinship', () => {
  it.each([
    ['me', 'dad', 1, 0],
    ['dad', 'me', 0, 1],
    ['me', 'grandpa', 2, 0],
    ['grandma', 'me', 0, 2],
    ['me', 'aunt', 2, 1],
    ['aunt', 'me', 1, 2],
    ['me', 'cousin', 2, 2],
  ])('counts %s → %s as a blood relation of %i up and %i down', (from, to, ups, downs) => {
    expect(kinshipOf(from, to)).toMatchObject({ kind: 'blood', ups, downs })
  })

  it('recognises full siblings, who share the same union', () => {
    expect(kinshipOf('me', 'sister')).toMatchObject({ ups: 1, downs: 1, fullSiblings: true })
  })

  it('recognises half-siblings, who share one parent only', () => {
    expect(kinshipOf('me', 'half')).toMatchObject({ ups: 1, downs: 1, fullSiblings: false })
  })

  it('classifies a partner as partner, not as a half-sibling', () => {
    expect(kinshipOf('dad', 'mum')).toEqual({ kind: 'partner', unionType: 'MARRIAGE' })
  })

  it('keeps the type of the union for other partners', () => {
    expect(kinshipOf('aunt', 'uncle')).toEqual({ kind: 'partner', unionType: 'PARTNERSHIP' })
  })

  it('classifies a path through a partner as alliance', () => {
    expect(kinshipOf('mum', 'grandma')).toEqual({ kind: 'alliance', links: 2 })
  })

  it('classifies a path going down then up as alliance', () => {
    // A child recorded in two unions, one per parent: the parents only meet through the child.
    const split = Family.of(
      [person('p1'), person('p2'), person('child')],
      [unionOf('u1', ['p1'], ['child']), unionOf('u2', ['p2'], ['child'])],
    )
    const path = shortestKinshipPath(split, memberId('p1'), memberId('p2'))

    expect(path && classifyKinship(path, split)).toEqual({ kind: 'alliance', links: 2 })
  })

  it('finds the paternal branch from the first parent reached', () => {
    expect(kinshipOf('me', 'grandpa')).toMatchObject({ branch: 'paternal' })
  })

  it('finds the maternal branch from the first parent reached', () => {
    expect(kinshipOf('me', 'granny2')).toMatchObject({ branch: 'maternal' })
  })

  it('has no branch when the path does not go up first', () => {
    expect(kinshipOf('me', 'sister')).toMatchObject({ branch: null })
  })
})
