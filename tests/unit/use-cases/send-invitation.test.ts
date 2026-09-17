import { beforeEach, describe, expect, it } from 'vitest'
import { Invitation } from '@/core/entities/invitation'
import { SendInvitationUseCase } from '@/core/use-cases/send-invitation'
import { invitationWorld } from '@tests/support/invitation-world'
import { EDITOR_ID } from '@tests/support/tree-fixtures'

function anInvitation(overrides: Partial<Parameters<typeof Invitation.send>[0]> = {}) {
  return Invitation.send({
    id: 'inv_existing',
    treeId: 'tree_diallo',
    email: 'fatou@example.com',
    role: 'VIEWER',
    token: 'stale-token',
    expiresAt: new Date('2026-09-01T00:00:00Z'),
    now: new Date('2026-08-01T00:00:00Z'),
    ...overrides,
  })
}

describe('SendInvitationUseCase', () => {
  let world: ReturnType<typeof invitationWorld>

  beforeEach(() => {
    world = invitationWorld()
  })

  const send = (viewerId: string, email = 'nouvelle@example.com', role: 'EDITOR' | 'VIEWER' = 'EDITOR') =>
    new SendInvitationUseCase(world.deps()).execute({ treeId: 'tree_diallo', viewerId, email, role })

  it('sends a fresh invitation and emails it to the address', async () => {
    const result = await send('usr_owner')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.sentInvitations).toMatchObject([
      { treeId: 'tree_diallo', email: 'nouvelle@example.com', role: 'EDITOR', status: 'PENDING' },
    ])
    expect(world.mailer.sent).toMatchObject([
      { inviterName: 'Awa Diallo', treeName: 'Famille Diallo', token: 'token-1' },
    ])
  })

  it('resets a still-pending invitation to the same email instead of adding a second one', async () => {
    world.invitations.seed(anInvitation())

    const result = await send('usr_owner', 'fatou@example.com')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.sentInvitations).toMatchObject([{ id: 'inv_existing', role: 'EDITOR' }])
  })

  it('resets a rejected invitation to the same email, instead of failing (legacy bug 1)', async () => {
    const rejected = anInvitation().resolve('REJECTED', {
      userId: 'irrelevant',
      now: new Date('2026-08-02T00:00:00Z'),
    })
    world.invitations.seed(rejected.ok ? rejected.value : anInvitation())

    const result = await send('usr_owner', 'fatou@example.com')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.sentInvitations).toMatchObject([
      { id: 'inv_existing', status: 'PENDING', role: 'EDITOR' },
    ])
  })

  it('refuses to reset an already accepted collaborator', async () => {
    const accepted = anInvitation().resolve('ACCEPTED', {
      userId: EDITOR_ID,
      now: new Date('2026-08-02T00:00:00Z'),
    })
    world.invitations.seed(accepted.ok ? accepted.value : anInvitation())

    const result = await send('usr_owner', 'fatou@example.com')

    expect(!result.ok && result.error).toEqual({ kind: 'ALREADY_COLLABORATOR' })
    expect(world.unitOfWork.sentInvitations).toEqual([])
  })

  it('refuses a malformed email', async () => {
    const result = await send('usr_owner', 'not-an-email')
    expect(!result.ok && result.error).toEqual({ kind: 'INVALID_EMAIL' })
  })

  it('refuses anyone but the owner', async () => {
    const result = await send(EDITOR_ID)
    expect(!result.ok && result.error).toEqual({ kind: 'TREE_MANAGEMENT_FORBIDDEN' })
  })
})
