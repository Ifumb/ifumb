import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import {
  childLinkDiff,
  unionCreationDiff,
  unionDeletionDiff,
  unionRevisionDiff,
} from '@/core/entities/union-audit'
import { aMember, aUnion, dateOf, memberId } from '@tests/support/family-fixtures'

const family = Family.of(
  [
    aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa' }),
    aMember({ id: memberId('mbr_awa'), firstName: 'Awa' }),
    aMember({ id: memberId('mbr_fatou'), firstName: 'Fatou', lastName: 'Sow' }),
    aMember({ id: memberId('mbr_binta'), firstName: 'Binta', lastName: null }),
  ],
  [],
)

describe('union audit diffs', () => {
  it('records a new union by its type, parents’ names and known dates', () => {
    const union = aUnion({ parent2Id: null, startDate: dateOf('1955-06') })

    expect(unionCreationDiff(union, family)).toEqual({
      before: null,
      after: { type: 'MARRIAGE', parent1Name: 'Moussa Diallo', startDate: '1955-06' },
    })
  })

  it('records only the fields a revision changed', () => {
    const before = aUnion({ startDate: dateOf('1955') })
    const after = aUnion({ parent2Id: memberId('mbr_binta'), startDate: dateOf('1955') })

    expect(unionRevisionDiff(before, after, family)).toEqual({
      before: { parent2Name: 'Awa Diallo' },
      after: { parent2Name: 'Binta' },
    })
  })

  it('records a deleted union with the children who lose that link', () => {
    const union = aUnion({
      type: 'BIOLOGICAL',
      children: [
        { childId: memberId('mbr_fatou'), filiation: 'BIOLOGICAL' },
        { childId: memberId('mbr_binta'), filiation: 'ADOPTIVE' },
      ],
    })

    expect(unionDeletionDiff(union, family)).toEqual({
      before: {
        type: 'BIOLOGICAL',
        parent1Name: 'Moussa Diallo',
        parent2Name: 'Awa Diallo',
        childrenNames: 'Fatou Sow, Binta',
      },
      after: null,
    })
  })

  it('records an added or removed child with its filiation', () => {
    expect(childLinkDiff('added', 'Fatou Sow', 'ADOPTIVE')).toEqual({
      before: null,
      after: { addedChildName: 'Fatou Sow', filiation: 'ADOPTIVE' },
    })
    expect(childLinkDiff('removed', 'Fatou Sow', 'BIOLOGICAL')).toEqual({
      before: { removedChildName: 'Fatou Sow', filiation: 'BIOLOGICAL' },
      after: null,
    })
  })
})
