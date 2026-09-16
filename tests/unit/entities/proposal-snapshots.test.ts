import { describe, expect, it } from 'vitest'
import {
  unionProposalCreationSnapshot,
  unionProposalDeletionSnapshot,
  unionProposalRevisionSnapshot,
} from '@/core/entities/proposal-snapshots'
import { aUnion, dateOf, memberId } from '@tests/support/family-fixtures'

describe('unionProposalCreationSnapshot', () => {
  it('keeps the raw parent ids, not their names', () => {
    const union = aUnion({ startDate: dateOf('2010-06') })
    expect(unionProposalCreationSnapshot(union)).toEqual({
      before: null,
      after: {
        type: 'MARRIAGE',
        parent1Id: 'mbr_moussa',
        parent2Id: 'mbr_awa',
        startDate: '2010-06',
      },
    })
  })

  it('leaves out a single parent and unset dates', () => {
    const union = aUnion({ parent2Id: null })
    expect(unionProposalCreationSnapshot(union).after).toEqual({
      type: 'MARRIAGE',
      parent1Id: 'mbr_moussa',
    })
  })
})

describe('unionProposalRevisionSnapshot', () => {
  it('keeps only the fields that changed', () => {
    const before = aUnion({ type: 'MARRIAGE', startDate: dateOf('2010-06') })
    const after = aUnion({ type: 'PARTNERSHIP', startDate: dateOf('2010-06') })

    expect(unionProposalRevisionSnapshot(before, after)).toEqual({
      before: { type: 'MARRIAGE' },
      after: { type: 'PARTNERSHIP' },
    })
  })

  it('records a parent change by id', () => {
    const before = aUnion({ parent2Id: memberId('mbr_awa') })
    const after = aUnion({ parent2Id: memberId('mbr_binta') })

    expect(unionProposalRevisionSnapshot(before, after)).toEqual({
      before: { parent2Id: 'mbr_awa' },
      after: { parent2Id: 'mbr_binta' },
    })
  })

  it('is empty when nothing changed', () => {
    const union = aUnion()
    expect(unionProposalRevisionSnapshot(union, union)).toEqual({ before: {}, after: {} })
  })
})

describe('unionProposalDeletionSnapshot', () => {
  it('keeps what the union was, and nothing after', () => {
    const union = aUnion()
    expect(unionProposalDeletionSnapshot(union)).toEqual({
      before: { type: 'MARRIAGE', parent1Id: 'mbr_moussa', parent2Id: 'mbr_awa' },
      after: null,
    })
  })
})
