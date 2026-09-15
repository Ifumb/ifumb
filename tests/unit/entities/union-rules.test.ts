import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { isDescendantOrSelf } from '@/core/entities/family-descent'
import { canManageUnions } from '@/core/entities/union-access'
import {
  childLinkProblem,
  parentChangeProblem,
  unionDetailsProblem,
} from '@/core/entities/union-rules'
import type { UnionDetailsInput } from '@/core/entities/union'
import { extendedFamily, unionOf } from '@tests/support/family-builder'
import { dateOf, memberId } from '@tests/support/family-fixtures'

const family = extendedFamily()
const unionById = (id: string) => {
  const union = family.findUnion(id)
  if (!union) throw new Error(`Missing union ${id}`)
  return union
}

describe('isDescendantOrSelf', () => {
  it.each([
    ['me', 'grandpa', true],
    ['me', 'me', true],
    ['cousin', 'grandma', true],
    ['grandpa', 'me', false],
    ['sister', 'me', false],
    ['cousin', 'dad', false],
    ['half', 'mum', false],
  ])('%s descends from %s: %s', (candidate, ancestor, expected) => {
    expect(isDescendantOrSelf(family, memberId(candidate), memberId(ancestor))).toBe(expected)
  })
})

describe('unionDetailsProblem', () => {
  const details = (overrides: Partial<UnionDetailsInput>): UnionDetailsInput => ({
    type: 'MARRIAGE',
    parent1Id: memberId('dad'),
    parent2Id: memberId('mum'),
    startDate: null,
    endDate: null,
    ...overrides,
  })

  it.each([
    [{ parent2Id: memberId('stranger') }, 'PARENT_NOT_FOUND'],
    [{ parent1Id: memberId('stranger'), parent2Id: null }, 'PARENT_NOT_FOUND'],
    [{ parent2Id: memberId('dad') }, 'SAME_PARENT_TWICE'],
    [{ startDate: dateOf('1990'), endDate: dateOf('1989-12') }, 'END_BEFORE_START'],
    [{ startDate: dateOf('1990-06'), endDate: dateOf('1990') }, null],
    [{ parent2Id: null }, null],
  ])('finds %o to be %s', (overrides, problem) => {
    expect(unionDetailsProblem(family, details(overrides))).toBe(problem)
  })
})

describe('childLinkProblem', () => {
  it.each([
    ['dad', 'CHILD_IS_PARENT'],
    ['me', 'ALREADY_CHILD'],
    ['grandpa', 'FAMILY_CYCLE'],
    ['cousin', null],
  ])('adding %s to the parents’ union is %s', (child, problem) => {
    expect(childLinkProblem(family, unionById('u_parents'), memberId(child))).toBe(problem)
  })

  it('refuses a child already born to another union of the same two parents', () => {
    const again = unionOf('u_again', ['mum', 'dad'], [])
    const withAgain = Family.of(family.members(), [...family.unions(), again])

    expect(childLinkProblem(withAgain, again, memberId('me'))).toBe('SAME_PARENTS_UNION_EXISTS')
  })
})

describe('parentChangeProblem', () => {
  it.each([
    [['grandpa', 'me'], 'FAMILY_CYCLE'],
    [['grandpa', 'dad'], 'FAMILY_CYCLE'],
    [['grandpa', 'other'], null],
  ])('giving the grandparents’ union the parents %o is %s', (parents, problem) => {
    const ids = parents.map((id) => memberId(id))
    expect(parentChangeProblem(family, unionById('u_grand'), ids)).toBe(problem)
  })
})

describe('canManageUnions', () => {
  it.each([
    ['OWNER', true],
    ['EDITOR', false],
    ['VIEWER', false],
  ] as const)('%s may manage unions: %s', (role, allowed) => {
    expect(canManageUnions(role)).toBe(allowed)
  })
})
