import { beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { RespondToInvitationUseCase } from '@/core/use-cases/respond-to-invitation'
import { EDITOR_EMAIL, EDITOR_ID, invitationWorld } from '@tests/support/invitation-world'
import { OWNER_ID } from '@tests/support/tree-fixtures'

function aPendingInvitation() {
  return Invitation.send({
    id: 'inv_1',
    treeId: 'tree_diallo',
    email: EDITOR_EMAIL,
    role: 'EDITOR',
    token: 'the-token',
    expiresAt: new Date('2026-09-24T10:00:00Z'),
    now: new Date('2026-09-17T10:00:00Z'),
  })
}

describe('RespondToInvitationUseCase', () => {
  let world: ReturnType<typeof invitationWorld>

  beforeEach(() => {
    world = invitationWorld()
    world.invitations.seed(aPendingInvitation())
  })

  const respond = (viewerId: string, decision: 'ACCEPTED' | 'REJECTED', token = 'the-token') =>
    new RespondToInvitationUseCase(world.deps()).execute({ token, viewerId, decision })

  it('accepts, recording who accepted', async () => {
    const result = await respond(EDITOR_ID, 'ACCEPTED')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedInvitations).toMatchObject([
      { status: 'ACCEPTED', userId: EDITOR_ID, token: null },
    ])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'INVITATION_ACCEPTED' }])
  })

  it('rejects, linking no account', async () => {
    const result = await respond(EDITOR_ID, 'REJECTED')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedInvitations).toMatchObject([
      { status: 'REJECTED', userId: null, token: null },
    ])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'INVITATION_REJECTED' }])
  })

  it('refuses an account whose email does not match the invitation', async () => {
    const result = await respond(OWNER_ID, 'ACCEPTED')
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_EMAIL_MISMATCH' })
  })

  it('refuses an unknown token', async () => {
    const result = await respond(EDITOR_ID, 'ACCEPTED', 'wrong-token')
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_NOT_FOUND' })
  })

  it('refuses an invitation already resolved', async () => {
    // A resolved invitation always has its token cleared (see the entity); this fixture keeps one
    // only so the use case's own token lookup can still reach the entity's refusal to exercise it.
    world.invitations.seed(
      Invitation.create({
        id: 'inv_1',
        treeId: 'tree_diallo',
        email: EDITOR_EMAIL,
        role: 'EDITOR',
        status: 'ACCEPTED',
        token: 'the-token',
        expiresAt: new Date('2026-09-24T10:00:00Z'),
        userId: EDITOR_ID,
        createdAt: new Date('2026-09-17T10:00:00Z'),
        updatedAt: new Date('2026-09-17T10:00:00Z'),
      }),
    )

    const result = await respond(EDITOR_ID, 'REJECTED')
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_ALREADY_RESOLVED' })
  })
})
