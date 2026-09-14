import { describe, expect, it } from 'vitest'
import { Member, MEMBER_TEXT_LIMITS } from '@/core/entities/member'
import { DomainError } from '@/core/shared/errors/domain-error'
import { aMember, dateOf, memberId } from '@tests/support/family-fixtures'
import { memberInput } from '@tests/support/member-inputs'

const start = (overrides = {}) =>
  Member.start({ id: memberId('mbr_new'), ...memberInput(overrides) })

describe('Member writing', () => {
  it('starts a member with trimmed values, empty ones as null and nobody claiming it', () => {
    const member = start({ firstName: ' Awa ', nickname: '  ', biography: '' })

    expect(member.details).toMatchObject({
      firstName: 'Awa',
      nickname: null,
      biography: null,
      certainty: 'CONFIRMED',
      photoUrl: null,
    })
    expect(member.claimedById).toBeNull()
  })

  it('rejects a blank first name', () => {
    expect(() => start({ firstName: ' ' })).toThrow(DomainError)
  })

  it.each(Object.entries(MEMBER_TEXT_LIMITS))(
    'rejects a %s longer than %i characters',
    (field, max) => {
      expect(() => start({ [field]: 'x'.repeat(max + 1) })).toThrow(DomainError)
    },
  )

  it('revises only the changed fields and reports them', () => {
    const member = aMember({ tribe: 'Peul', birthDate: dateOf('1932') })

    const { member: revised, changes } = member.revise(
      memberInput({ tribe: 'Peul', birthDate: dateOf('1932-05-12'), certainty: 'APPROXIMATE' }),
    )

    expect(changes).toEqual([
      { field: 'birthDate', before: '1932', after: '1932-05-12' },
      { field: 'certainty', before: 'CONFIRMED', after: 'APPROXIMATE' },
    ])
    expect([revised.details.birthDate?.toString(), revised.details.certainty]).toEqual([
      '1932-05-12',
      'APPROXIMATE',
    ])
  })

  it('clears a field when it is emptied', () => {
    const member = aMember({ tribe: 'Peul', birthDate: dateOf('1932-05') })

    const { changes } = member.revise(memberInput({ tribe: '' }))

    expect(changes).toEqual([{ field: 'tribe', before: 'Peul', after: null }])
  })

  it('reports no change when the values are the same once trimmed', () => {
    const member = aMember({ tribe: 'Peul', birthDate: dateOf('1932-05') })

    const { member: revised, changes } = member.revise(memberInput({ firstName: ' Awa ' }))

    expect([changes, revised]).toEqual([[], member])
  })

  it('keeps who claimed the member and its photo through a revision', () => {
    const member = aMember({ claimedById: 'usr_awa', photoUrl: 'https://x/awa.jpg' })

    const { member: revised } = member.revise(memberInput({ nickname: 'Mama' }))

    expect([revised.claimedById, revised.details.photoUrl]).toEqual([
      'usr_awa',
      'https://x/awa.jpg',
    ])
  })
})
