import { describe, expect, it } from 'vitest'
import { aUnion, memberId } from '@tests/support/family-fixtures'

describe('Union entity', () => {
  it('lists its parents', () => {
    const union = aUnion()

    expect(union.parentIds.map((id) => id.value)).toEqual(['mbr_moussa', 'mbr_awa'])
  })

  // Legacy pending changes were applied without validation, so stored unions may break the
  // creation rules; reading them must not fail.
  it('tolerates the same parent recorded twice, listing it once', () => {
    const union = aUnion({ parent1Id: memberId('mbr_awa'), parent2Id: memberId('mbr_awa') })

    expect(union.parentIds.map((id) => id.value)).toEqual(['mbr_awa'])
  })

  it('tolerates a union whose parents are not recorded', () => {
    expect(aUnion({ parent1Id: null, parent2Id: null }).parentIds).toEqual([])
  })

  it('gives the other parent of a member, if any', () => {
    const union = aUnion()

    expect([
      union.otherParentOf(memberId('mbr_awa'))?.value,
      aUnion({ parent2Id: null }).otherParentOf(memberId('mbr_moussa')),
    ]).toEqual(['mbr_moussa', null])
  })

  it('knows its children and their filiation', () => {
    const union = aUnion({ children: [{ childId: memberId('mbr_fatou'), filiation: 'ADOPTIVE' }] })

    expect([union.hasChild(memberId('mbr_fatou')), union.hasChild(memberId('mbr_awa'))]).toEqual([
      true,
      false,
    ])
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(aUnion())).toBe(true)
  })
})
