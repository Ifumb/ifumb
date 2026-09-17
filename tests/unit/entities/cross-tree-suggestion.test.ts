import { describe, expect, it } from 'vitest'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'

const NOW = new Date('2026-09-17T10:00:00Z')
const LATER = new Date('2026-09-18T10:00:00Z')

function aSuggestion() {
  return CrossTreeSuggestion.propose({
    id: 'sug_1',
    treeId: 'tree_diallo',
    memberId: 'mbr_awa',
    targetTreeId: 'tree_toure',
    targetMemberId: 'mbr_fatou',
    confidence: 'HIGH',
    now: NOW,
  })
}

describe('CrossTreeSuggestion', () => {
  it('starts NEW', () => {
    const suggestion = aSuggestion()
    expect([suggestion.status, suggestion.isNew]).toEqual(['NEW', true])
  })

  it('accepts once, from NEW to ACCEPTED', () => {
    const accepted = aSuggestion().accept(LATER)
    expect(accepted.ok && [accepted.value.status, accepted.value.isNew]).toEqual(['ACCEPTED', false])
  })

  it('rejects once, from NEW to REJECTED', () => {
    const rejected = aSuggestion().reject(LATER)
    expect(rejected.ok && rejected.value.status).toBe('REJECTED')
  })

  it('refuses to accept a suggestion already resolved', () => {
    const accepted = aSuggestion().accept(LATER)
    const again = accepted.ok && accepted.value.accept(LATER)
    expect(again && !again.ok && again.error).toEqual({ kind: 'SUGGESTION_ALREADY_RESOLVED' })
  })

  it('refuses to reject a suggestion already resolved', () => {
    const rejected = aSuggestion().reject(LATER)
    const again = rejected.ok && rejected.value.reject(LATER)
    expect(again && !again.ok && again.error).toEqual({ kind: 'SUGGESTION_ALREADY_RESOLVED' })
  })
})
