import { describe, expect, it } from 'vitest'
import { PendingChange, REJECTION_COMMENT_MAX_LENGTH } from '@/core/entities/pending-change'
import { DomainError } from '@/core/shared/errors/domain-error'

const NOW = new Date('2026-09-16T10:00:00Z')
const LATER = new Date('2026-09-17T09:00:00Z')

function aProposal() {
  return PendingChange.propose({
    id: 'pc_1',
    treeId: 'tree_diallo',
    authorId: 'usr_editor',
    targetType: 'MEMBER',
    targetId: 'mbr_awa',
    action: 'UPDATE',
    snapshotBefore: { tribe: 'Peul' },
    snapshotAfter: { tribe: 'Soninke' },
    createdAt: NOW,
  })
}

describe('PendingChange', () => {
  it('proposes a change as PENDING, unresolved', () => {
    const change = aProposal()
    expect(change.status).toBe('PENDING')
    expect(change.isPending).toBe(true)
    expect([change.rejectionComment, change.resolvedAt, change.resolvedById]).toEqual([
      null,
      null,
      null,
    ])
  })

  it('approves a pending change, recording who and when', () => {
    const result = aProposal().resolve('APPROVED', { resolvedById: 'usr_owner', now: LATER })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.status).toBe('APPROVED')
    expect(result.value.isPending).toBe(false)
    expect(result.value.resolvedById).toBe('usr_owner')
    expect(result.value.resolvedAt).toBe(LATER)
  })

  it('rejects a pending change with a trimmed comment', () => {
    const result = aProposal().resolve('REJECTED', {
      resolvedById: 'usr_owner',
      now: LATER,
      comment: '  Merci de vérifier la date  ',
    })

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        status: 'REJECTED',
        rejectionComment: 'Merci de vérifier la date',
      }),
    })
  })

  it('treats a blank comment as no comment', () => {
    const result = aProposal().resolve('REJECTED', {
      resolvedById: 'usr_owner',
      now: LATER,
      comment: '   ',
    })

    expect(result.ok && result.value.rejectionComment).toBe(null)
  })

  it('refuses to resolve a change that already was', () => {
    const resolved = aProposal().resolve('APPROVED', { resolvedById: 'usr_owner', now: LATER })
    expect(resolved.ok).toBe(true)
    if (!resolved.ok) return

    expect(resolved.value.resolve('REJECTED', { resolvedById: 'usr_owner', now: LATER })).toEqual({
      ok: false,
      error: { kind: 'ALREADY_RESOLVED' },
    })
  })

  it('refuses a comment past the length limit', () => {
    const tooLong = 'x'.repeat(REJECTION_COMMENT_MAX_LENGTH + 1)
    expect(() =>
      aProposal().resolve('REJECTED', { resolvedById: 'usr_owner', now: LATER, comment: tooLong }),
    ).toThrow(DomainError)
  })
})
