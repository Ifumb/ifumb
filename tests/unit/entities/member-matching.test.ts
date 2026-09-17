import { describe, expect, it } from 'vitest'
import { matchConfidence, type MatchableMember } from '@/core/entities/member-matching'

function aCandidate(overrides: Partial<MatchableMember> = {}): MatchableMember {
  return {
    treeId: 'tree_diallo',
    memberId: 'mbr_awa',
    firstName: 'Awa',
    lastName: 'Diallo',
    birthYear: 1932,
    culturalTokens: ['peul'],
    ...overrides,
  }
}

describe('matchConfidence', () => {
  it('never matches a different last name', () => {
    const other = aCandidate({ treeId: 'tree_toure', memberId: 'mbr_x', lastName: 'Touré' })
    expect(matchConfidence(aCandidate(), other)).toBeNull()
  })

  it('never matches when one has no last name at all', () => {
    const other = aCandidate({ treeId: 'tree_toure', memberId: 'mbr_x', lastName: null })
    expect(matchConfidence(aCandidate(), other)).toBeNull()
  })

  it('still matches a birth year gap of exactly 5 years', () => {
    const other = aCandidate({ treeId: 'tree_toure', memberId: 'mbr_x', birthYear: 1937 })
    expect(matchConfidence(aCandidate(), other)).not.toBeNull()
  })

  it('disqualifies a birth year gap of 6 years', () => {
    const other = aCandidate({ treeId: 'tree_toure', memberId: 'mbr_x', birthYear: 1938 })
    expect(matchConfidence(aCandidate(), other)).toBeNull()
  })

  it('tolerates an unknown birth year on either side', () => {
    const other = aCandidate({ treeId: 'tree_toure', memberId: 'mbr_x', birthYear: null })
    expect(matchConfidence(aCandidate(), other)).not.toBeNull()
  })

  it('is HIGH for an exact first name plus a shared cultural token, even with no birth year to compare', () => {
    const other = aCandidate({
      treeId: 'tree_toure',
      memberId: 'mbr_x',
      birthYear: null,
      culturalTokens: ['Peul'],
    })
    expect(matchConfidence(aCandidate(), other)).toBe('HIGH')
  })

  it('is HIGH for an exact first name plus an exact birth year, without a shared token', () => {
    const other = aCandidate({
      treeId: 'tree_toure',
      memberId: 'mbr_x',
      birthYear: 1932,
      culturalTokens: [],
    })
    expect(matchConfidence(aCandidate(), other)).toBe('HIGH')
  })

  it('is MEDIUM for an exact first name alone', () => {
    const other = aCandidate({
      treeId: 'tree_toure',
      memberId: 'mbr_x',
      birthYear: null,
      culturalTokens: [],
    })
    expect(matchConfidence(aCandidate(), other)).toBe('MEDIUM')
  })

  it('is LOW for a first name that is a substring of the other', () => {
    const other = aCandidate({
      treeId: 'tree_toure',
      memberId: 'mbr_x',
      firstName: 'Awatou',
      birthYear: null,
      culturalTokens: [],
    })
    expect(matchConfidence(aCandidate(), other)).toBe('LOW')
  })

  it('matches nothing when neither the name nor a substring lines up', () => {
    const other = aCandidate({ treeId: 'tree_toure', memberId: 'mbr_x', firstName: 'Fatou' })
    expect(matchConfidence(aCandidate(), other)).toBeNull()
  })
})
