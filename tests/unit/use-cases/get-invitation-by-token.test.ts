import { beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { GetInvitationByTokenUseCase } from '@/core/use-cases/get-invitation-by-token'
import { invitationWorld } from '@tests/support/invitation-world'

describe('GetInvitationByTokenUseCase', () => {
  let world: ReturnType<typeof invitationWorld>

  beforeEach(() => {
    world = invitationWorld()
  })

  const lookup = (token: string) => new GetInvitationByTokenUseCase(world.deps()).execute(token)

  it('shows the tree and the inviting owner for a pending invitation', async () => {
    world.invitations.seed(
      Invitation.send({
        id: 'inv_1',
        treeId: 'tree_diallo',
        email: 'fatou@example.com',
        role: 'EDITOR',
        token: 'the-token',
        expiresAt: new Date('2026-09-24T10:00:00Z'),
        now: new Date('2026-09-17T10:00:00Z'),
      }),
    )

    const result = await lookup('the-token')

    expect(result.ok && result.value).toMatchObject({
      treeId: 'tree_diallo',
      treeName: 'Famille Diallo',
      inviterName: 'Awa Diallo',
      email: 'fatou@example.com',
      role: 'EDITOR',
      status: 'PENDING',
    })
  })

  it('reports an unknown token as not found', async () => {
    const result = await lookup('unknown')
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_NOT_FOUND' })
  })

  it('reports a pending invitation past its expiry as expired', async () => {
    world.invitations.seed(
      Invitation.send({
        id: 'inv_1',
        treeId: 'tree_diallo',
        email: 'fatou@example.com',
        role: 'EDITOR',
        token: 'the-token',
        expiresAt: new Date('2026-09-01T00:00:00Z'),
        now: new Date('2026-08-25T00:00:00Z'),
      }),
    )

    const result = await lookup('the-token')
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_EXPIRED' })
  })
})
