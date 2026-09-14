import { describe, expect, it } from 'vitest'
import { canAddMember, canDeleteMember, canEditMember } from '@/core/entities/member-access'
import {
  memberCreationDiff,
  memberDeletionDiff,
  memberRevisionDiff,
} from '@/core/entities/member-audit'
import { datesInOrder } from '@/core/entities/member-dates'
import { aMember, dateOf } from '@tests/support/family-fixtures'

describe('datesInOrder', () => {
  it.each([
    ['1932-05-12', '2001-01-01'],
    ['1932-05-12', '1932-05-12'],
    ['1950-06', '1950'],
    ['1950', '1950-01-01'],
    ['1950-06-15', '1950-06'],
  ])('accepts a birth on %s and a death on %s', (birth, death) => {
    expect(datesInOrder(dateOf(birth), dateOf(death))).toBe(true)
  })

  it.each([
    ['1950', '1949-12-31'],
    ['1950-06', '1950-05'],
    ['1950-06-15', '1950-06-14'],
  ])('refuses a birth on %s and a death certainly before, on %s', (birth, death) => {
    expect(datesInOrder(dateOf(birth), dateOf(death))).toBe(false)
  })

  it('accepts missing dates', () => {
    expect([datesInOrder(null, dateOf('1950')), datesInOrder(dateOf('1950'), null)]).toEqual([
      true,
      true,
    ])
  })
})

describe('member access', () => {
  it.each([
    ['OWNER', true],
    ['EDITOR', false],
    ['VIEWER', false],
  ] as const)('lets %s add and delete members: %s', (role, allowed) => {
    expect([canAddMember(role), canDeleteMember(role)]).toEqual([allowed, allowed])
  })

  it.each([
    ['the owner', 'OWNER', 'usr_owner', true],
    ['an editor', 'EDITOR', 'usr_editor', false],
    ['the viewer who claimed the member', 'VIEWER', 'usr_awa', true],
    ['an editor who claimed the member', 'EDITOR', 'usr_awa', true],
    ['another viewer', 'VIEWER', 'usr_other', false],
    ['an anonymous visitor', 'VIEWER', undefined, false],
  ] as const)('lets %s edit the member: %s', (_, role, viewerId, allowed) => {
    expect(canEditMember(role, aMember({ claimedById: 'usr_awa' }), viewerId)).toBe(allowed)
  })

  it('never lets an anonymous visitor edit an unclaimed member', () => {
    expect(canEditMember('VIEWER', aMember({ claimedById: null }), undefined)).toBe(false)
  })
})

describe('member audit diffs', () => {
  const member = aMember({
    lastName: 'Diallo',
    tribe: 'Peul',
    birthDate: dateOf('1932-05'),
    gender: null,
  })

  it('records the filled fields of a created member', () => {
    expect(memberCreationDiff(member)).toEqual({
      before: null,
      after: {
        firstName: 'Awa',
        lastName: 'Diallo',
        birthDate: '1932-05',
        tribe: 'Peul',
        certainty: 'CONFIRMED',
      },
    })
  })

  it('records only the changed fields of a revision, both sides', () => {
    expect(memberRevisionDiff([{ field: 'tribe', before: 'Peul', after: null }])).toEqual({
      before: { tribe: 'Peul' },
      after: { tribe: null },
    })
  })

  it('records the filled fields of a deleted member, before', () => {
    expect(memberDeletionDiff(member)).toEqual({
      before: {
        firstName: 'Awa',
        lastName: 'Diallo',
        birthDate: '1932-05',
        tribe: 'Peul',
        certainty: 'CONFIRMED',
      },
      after: null,
    })
  })
})
