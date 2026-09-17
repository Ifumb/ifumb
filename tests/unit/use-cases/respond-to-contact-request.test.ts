import { beforeEach, describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'
import { RespondToContactRequestUseCase } from '@/core/use-cases/respond-to-contact-request'
import { OWNER_ID, REQUESTER_ID, contactRequestWorld } from '@tests/support/contact-request-world'
import { EDITOR_ID } from '@tests/support/tree-fixtures'

function aPendingRequest() {
  return ContactRequest.send({
    id: 'cr_1',
    treeId: 'tree_diallo',
    memberId: 'mbr_awa',
    requesterId: REQUESTER_ID,
    message: null,
    now: new Date('2026-09-17T10:00:00Z'),
  })
}

describe('RespondToContactRequestUseCase', () => {
  let world: ReturnType<typeof contactRequestWorld>

  beforeEach(() => {
    world = contactRequestWorld()
    world.contactRequests.seed(aPendingRequest())
  })

  const respond = (viewerId: string, decision: 'ACCEPTED' | 'REFUSED') =>
    new RespondToContactRequestUseCase(world.deps()).execute({
      contactRequestId: 'cr_1',
      viewerId,
      decision,
    })

  it('accepts, notifying the requester', async () => {
    const result = await respond(OWNER_ID, 'ACCEPTED')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedContactRequests).toMatchObject([{ status: 'ACCEPTED' }])
    expect(world.unitOfWork.notifications).toMatchObject([
      { userId: REQUESTER_ID, type: 'CONTACT_REQUEST_RESPONDED' },
    ])
  })

  it('refuses anyone but the tree owner', async () => {
    const result = await respond(EDITOR_ID, 'ACCEPTED')
    expect(!result.ok && result.error).toEqual({ kind: 'NOT_TREE_OWNER' })
  })

  it('refuses a request already resolved', async () => {
    const resolved = aPendingRequest().respond('ACCEPTED', new Date('2026-09-17T11:00:00Z'))
    if (!resolved.ok) throw new Error('Fixture setup failed')
    world.contactRequests.seed(resolved.value)

    const again = await respond(OWNER_ID, 'REFUSED')
    expect(!again.ok && again.error).toEqual({ kind: 'CONTACT_REQUEST_ALREADY_RESOLVED' })
  })

  it('refuses an unknown request', async () => {
    const result = await new RespondToContactRequestUseCase(world.deps()).execute({
      contactRequestId: 'cr_unknown',
      viewerId: OWNER_ID,
      decision: 'ACCEPTED',
    })
    expect(!result.ok && result.error).toEqual({ kind: 'CONTACT_REQUEST_NOT_FOUND' })
  })
})
