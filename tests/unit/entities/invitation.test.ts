import { describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'

const NOW = new Date('2026-09-17T10:00:00Z')
const LATER = new Date('2026-09-18T10:00:00Z')
const AFTER_EXPIRY = new Date('2026-09-30T00:00:00Z')

function aPendingInvitation() {
  return Invitation.send({
    id: 'inv_1',
    treeId: 'tree_diallo',
    email: 'fatou@example.com',
    role: 'EDITOR',
    token: 'token-1',
    expiresAt: new Date('2026-09-24T10:00:00Z'),
    now: NOW,
  })
}

describe('Invitation', () => {
  it('starts PENDING, with the token it was sent with', () => {
    const invitation = aPendingInvitation()
    expect([invitation.status, invitation.token, invitation.userId]).toEqual([
      'PENDING',
      'token-1',
      null,
    ])
  })

  it('accepts, linking the account and clearing the token', () => {
    const resolved = aPendingInvitation().resolve('ACCEPTED', { userId: 'usr_editor', now: LATER })
    expect(resolved.ok && [resolved.value.status, resolved.value.userId, resolved.value.token]).toEqual(
      ['ACCEPTED', 'usr_editor', null],
    )
  })

  it('rejects, clearing the token without linking any account', () => {
    const resolved = aPendingInvitation().resolve('REJECTED', { userId: 'usr_editor', now: LATER })
    expect(resolved.ok && [resolved.value.status, resolved.value.userId, resolved.value.token]).toEqual(
      ['REJECTED', null, null],
    )
  })

  it('refuses to resolve an invitation already resolved', () => {
    const accepted = aPendingInvitation().resolve('ACCEPTED', { userId: 'usr_editor', now: LATER })
    const again = accepted.ok && accepted.value.resolve('REJECTED', { userId: 'usr_editor', now: LATER })
    expect(again && !again.ok && again.error).toEqual({ kind: 'INVITATION_ALREADY_RESOLVED' })
  })

  it('refuses to resolve a pending invitation past its expiry', () => {
    const resolved = aPendingInvitation().resolve('ACCEPTED', {
      userId: 'usr_editor',
      now: AFTER_EXPIRY,
    })
    expect(!resolved.ok && resolved.error).toEqual({ kind: 'INVITATION_EXPIRED' })
  })

  it('changes the role of an accepted invitation', () => {
    const accepted = aPendingInvitation().resolve('ACCEPTED', { userId: 'usr_editor', now: LATER })
    const changed = accepted.ok && accepted.value.changeRole('VIEWER', AFTER_EXPIRY)
    expect(changed && changed.ok && changed.value.role).toBe('VIEWER')
  })

  it('refuses to change the role of an invitation still pending', () => {
    const changed = aPendingInvitation().changeRole('VIEWER', LATER)
    expect(!changed.ok && changed.error).toEqual({ kind: 'INVITATION_NOT_ACCEPTED' })
  })

  it('is expired only once its link has passed its date', () => {
    const invitation = aPendingInvitation()
    expect([invitation.isExpired(LATER), invitation.isExpired(AFTER_EXPIRY)]).toEqual([false, true])
  })
})
