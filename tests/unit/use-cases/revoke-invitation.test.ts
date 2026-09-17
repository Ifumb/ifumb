import { beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { RevokeInvitationUseCase } from '@/core/use-cases/revoke-invitation'
import { EDITOR_EMAIL, EDITOR_ID, invitationWorld } from '@tests/support/invitation-world'

describe('RevokeInvitationUseCase', () => {
  let world: ReturnType<typeof invitationWorld>

  beforeEach(() => {
    world = invitationWorld()
  })

  const revoke = (viewerId: string, invitationId = 'inv_1') =>
    new RevokeInvitationUseCase(world.deps()).execute({ treeId: 'tree_diallo', viewerId, invitationId })

  it('revokes a still-pending invitation, without touching any pending proposal', async () => {
    world.invitations.seed(
      Invitation.send({
        id: 'inv_1',
        treeId: 'tree_diallo',
        email: 'other@example.com',
        role: 'VIEWER',
        token: 'tok',
        expiresAt: new Date('2026-09-24T10:00:00Z'),
        now: new Date('2026-09-10T00:00:00Z'),
      }),
    )

    const result = await revoke('usr_owner')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.revokedInvitationIds).toEqual(['inv_1'])
    expect(world.unitOfWork.rejectedAllByAuthor).toEqual([])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'INVITATION_REVOKED' }])
  })

  it('also rejects the revoked collaborator’s still-pending proposals on this tree', async () => {
    const sent = Invitation.send({
      id: 'inv_1',
      treeId: 'tree_diallo',
      email: EDITOR_EMAIL,
      role: 'EDITOR',
      token: 'tok',
      expiresAt: new Date('2026-09-24T10:00:00Z'),
      now: new Date('2026-09-10T00:00:00Z'),
    })
    const accepted = sent.resolve('ACCEPTED', { userId: EDITOR_ID, now: new Date('2026-09-11T00:00:00Z') })
    if (!accepted.ok) throw new Error('Fixture setup failed')
    world.invitations.seed(accepted.value)

    const result = await revoke('usr_owner')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.rejectedAllByAuthor).toMatchObject([
      { treeId: 'tree_diallo', authorId: EDITOR_ID },
    ])
  })

  it('refuses anyone but the owner', async () => {
    world.invitations.seed(
      Invitation.send({
        id: 'inv_1',
        treeId: 'tree_diallo',
        email: 'other@example.com',
        role: 'VIEWER',
        token: 'tok',
        expiresAt: new Date('2026-09-24T10:00:00Z'),
        now: new Date('2026-09-10T00:00:00Z'),
      }),
    )
    const result = await revoke(EDITOR_ID)
    expect(!result.ok && result.error).toEqual({ kind: 'TREE_MANAGEMENT_FORBIDDEN' })
  })

  it('refuses an unknown invitation', async () => {
    const result = await revoke('usr_owner', 'inv_unknown')
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_NOT_FOUND' })
  })
})
