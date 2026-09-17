import { beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { ListCollaboratorsUseCase } from '@/core/use-cases/list-collaborators'
import { EDITOR_EMAIL, EDITOR_ID, invitationWorld } from '@tests/support/invitation-world'

describe('ListCollaboratorsUseCase', () => {
  let world: ReturnType<typeof invitationWorld>

  beforeEach(() => {
    world = invitationWorld()
  })

  it('lists every invitation of the tree, for its owner', async () => {
    const accepted = Invitation.send({
      id: 'inv_1',
      treeId: 'tree_diallo',
      email: EDITOR_EMAIL,
      role: 'EDITOR',
      token: 'tok',
      expiresAt: new Date('2026-09-24T10:00:00Z'),
      now: new Date('2026-09-10T00:00:00Z'),
    }).resolve('ACCEPTED', { userId: EDITOR_ID, now: new Date('2026-09-11T00:00:00Z') })
    world.invitations.seed(
      accepted.ok ? accepted.value : never(),
      { firstName: 'Fatou', lastName: 'Sow' },
    )

    const result = await new ListCollaboratorsUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId: 'usr_owner',
    })

    expect(result.ok && result.value).toMatchObject({
      treeName: 'Famille Diallo',
      collaborators: [
        { invitation: { id: 'inv_1', status: 'ACCEPTED' }, user: { firstName: 'Fatou', lastName: 'Sow' } },
      ],
    })
  })

  it('refuses anyone but the owner', async () => {
    const result = await new ListCollaboratorsUseCase(world.deps()).execute({
      treeId: 'tree_diallo',
      viewerId: EDITOR_ID,
    })
    expect(!result.ok && result.error).toEqual({ kind: 'TREE_MANAGEMENT_FORBIDDEN' })
  })
})

function never(): never {
  throw new Error('Fixture setup failed')
}
