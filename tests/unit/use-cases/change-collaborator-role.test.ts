import { beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { ChangeCollaboratorRoleUseCase } from '@/core/use-cases/change-collaborator-role'
import { EDITOR_EMAIL, EDITOR_ID, invitationWorld } from '@tests/support/invitation-world'

function anAcceptedInvitation() {
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
  return accepted.value
}

describe('ChangeCollaboratorRoleUseCase', () => {
  let world: ReturnType<typeof invitationWorld>

  beforeEach(() => {
    world = invitationWorld()
    world.invitations.seed(anAcceptedInvitation())
  })

  const change = (viewerId: string, role: 'EDITOR' | 'VIEWER') =>
    new ChangeCollaboratorRoleUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId,
      invitationId: 'inv_1',
      role,
    })

  it('changes the role, with an audit entry', async () => {
    const result = await change('usr_owner', 'VIEWER')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.roleChangedInvitations).toMatchObject([{ id: 'inv_1', role: 'VIEWER' }])
    expect(world.unitOfWork.auditRecords).toMatchObject([{ action: 'ROLE_CHANGED' }])
  })

  it('writes nothing when the role does not actually change', async () => {
    const result = await change('usr_owner', 'EDITOR')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.roleChangedInvitations).toEqual([])
  })

  it('refuses anyone but the owner', async () => {
    const result = await change(EDITOR_ID, 'VIEWER')
    expect(!result.ok && result.error).toEqual({ kind: 'TREE_MANAGEMENT_FORBIDDEN' })
  })

  it('refuses an unknown invitation', async () => {
    const result = await new ChangeCollaboratorRoleUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId: 'usr_owner',
      invitationId: 'inv_unknown',
      role: 'VIEWER',
    })
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_NOT_FOUND' })
  })

  it('refuses an invitation not yet accepted', async () => {
    world.invitations.seed(
      Invitation.send({
        id: 'inv_2',
        treeId: 'tree_diallo',
        email: 'other@example.com',
        role: 'VIEWER',
        token: 'tok2',
        expiresAt: new Date('2026-09-24T10:00:00Z'),
        now: new Date('2026-09-10T00:00:00Z'),
      }),
    )
    const result = await new ChangeCollaboratorRoleUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId: 'usr_owner',
      invitationId: 'inv_2',
      role: 'EDITOR',
    })
    expect(!result.ok && result.error).toEqual({ kind: 'INVITATION_NOT_ACCEPTED' })
  })
})
