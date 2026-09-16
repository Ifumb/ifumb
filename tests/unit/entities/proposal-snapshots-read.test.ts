import { describe, expect, it } from 'vitest'
import {
  BLANK_MEMBER_DETAILS,
  memberDetailsFromSnapshot,
  unionDetailsFromSnapshot,
  type UnionSnapshotDetails,
} from '@/core/entities/proposal-snapshots'
import { dateOf } from '@tests/support/family-fixtures'
import { memberInput } from '@tests/support/member-inputs'

describe('memberDetailsFromSnapshot', () => {
  it('builds a full member from a creation snapshot', () => {
    const result = memberDetailsFromSnapshot(BLANK_MEMBER_DETAILS, {
      firstName: 'Awa',
      lastName: 'Diallo',
      tribe: 'Peul',
      certainty: 'CONFIRMED',
    })

    expect(result).toEqual({
      ok: true,
      value: { ...BLANK_MEMBER_DETAILS, firstName: 'Awa', lastName: 'Diallo', tribe: 'Peul' },
    })
  })

  it('overlays only the fields a revision snapshot names, keeping the rest current', () => {
    const current = memberInput({ tribe: 'Peul', nickname: 'Mama', birthDate: null })
    const result = memberDetailsFromSnapshot(current, { tribe: 'Soninke' })

    expect(result).toEqual({ ok: true, value: { ...current, tribe: 'Soninke' } })
  })

  it('clears a field the snapshot names as empty', () => {
    const current = memberInput({ tribe: 'Peul', birthDate: null })
    const result = memberDetailsFromSnapshot(current, { tribe: '' })

    expect(result.ok && result.value.tribe).toBe(null)
  })

  it('parses a recorded date back into a PartialDate', () => {
    const current = memberInput({ birthDate: null })
    const result = memberDetailsFromSnapshot(current, { birthDate: '1932-05' })

    expect(result.ok && result.value.birthDate?.toString()).toBe('1932-05')
  })

  it('ignores an unparseable date rather than failing the whole proposal', () => {
    const current = memberInput({ birthDate: dateOf('1930') })
    const result = memberDetailsFromSnapshot(current, { birthDate: 'not-a-date' })

    expect(result.ok && result.value.birthDate).toBe(null)
  })

  it('falls back to the default on an unrecognised enum value', () => {
    const current = memberInput({ gender: 'FEMALE' })
    const result = memberDetailsFromSnapshot(current, { gender: 'ALIEN' })

    expect(result.ok && result.value.gender).toBe(null)
  })

  it('is unreadable without a first name, and current has none either', () => {
    expect(memberDetailsFromSnapshot(BLANK_MEMBER_DETAILS, { tribe: 'Peul' })).toEqual({
      ok: false,
      error: { kind: 'PROPOSAL_UNREADABLE' },
    })
  })

  it('ignores keys the entity does not record, such as the legacy treeId or id', () => {
    const result = memberDetailsFromSnapshot(BLANK_MEMBER_DETAILS, {
      firstName: 'Awa',
      treeId: 'tree_diallo',
      id: 'mbr_awa',
    })

    expect(result).toEqual({ ok: true, value: { ...BLANK_MEMBER_DETAILS, firstName: 'Awa' } })
  })
})

describe('unionDetailsFromSnapshot', () => {
  const blank: UnionSnapshotDetails = {
    type: 'MARRIAGE',
    parent1Id: 'mbr_moussa',
    parent2Id: null,
    startDate: null,
    endDate: null,
  }

  it('builds full details from a creation snapshot', () => {
    const result = unionDetailsFromSnapshot(blank, {
      type: 'MARRIAGE',
      parent1Id: 'mbr_moussa',
      parent2Id: 'mbr_awa',
      startDate: '1955-06',
    })

    expect(result).toEqual({
      ok: true,
      value: {
        type: 'MARRIAGE',
        parent1Id: 'mbr_moussa',
        parent2Id: 'mbr_awa',
        startDate: dateOf('1955-06'),
        endDate: null,
      },
    })
  })

  it('overlays only the fields a revision snapshot names', () => {
    const current = { ...blank, parent2Id: 'mbr_awa', startDate: dateOf('1955') }
    const result = unionDetailsFromSnapshot(current, { type: 'PARTNERSHIP' })

    expect(result).toEqual({ ok: true, value: { ...current, type: 'PARTNERSHIP' } })
  })

  it('is unreadable without a first parent', () => {
    expect(unionDetailsFromSnapshot({ ...blank, parent1Id: '' }, {})).toEqual({
      ok: false,
      error: { kind: 'PROPOSAL_UNREADABLE' },
    })
  })
})
