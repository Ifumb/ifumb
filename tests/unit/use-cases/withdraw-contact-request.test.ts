import { beforeEach, describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'
import { WithdrawContactRequestUseCase } from '@/core/use-cases/withdraw-contact-request'
import { OWNER_ID, REQUESTER_ID, contactRequestWorld } from '@tests/support/contact-request-world'

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

describe('WithdrawContactRequestUseCase', () => {
  let world: ReturnType<typeof contactRequestWorld>

  beforeEach(() => {
    world = contactRequestWorld()
    world.contactRequests.seed(aPendingRequest())
  })

  const withdraw = (viewerId: string) =>
    new WithdrawContactRequestUseCase(world.deps()).execute({ contactRequestId: 'cr_1', viewerId })

  it('withdraws its own request, silently (no notification)', async () => {
    const result = await withdraw(REQUESTER_ID)

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.resolvedContactRequests).toMatchObject([{ status: 'WITHDRAWN' }])
    expect(world.unitOfWork.notifications).toEqual([])
  })

  it('refuses anyone but the requester', async () => {
    const result = await withdraw(OWNER_ID)
    expect(!result.ok && result.error).toEqual({ kind: 'NOT_REQUESTER' })
  })

  it('refuses a request already resolved', async () => {
    const resolved = aPendingRequest().withdraw(new Date('2026-09-17T11:00:00Z'))
    if (!resolved.ok) throw new Error('Fixture setup failed')
    world.contactRequests.seed(resolved.value)

    const result = await withdraw(REQUESTER_ID)
    expect(!result.ok && result.error).toEqual({ kind: 'CONTACT_REQUEST_ALREADY_RESOLVED' })
  })

  it('refuses an unknown request', async () => {
    const result = await new WithdrawContactRequestUseCase(world.deps()).execute({
      contactRequestId: 'cr_unknown',
      viewerId: REQUESTER_ID,
    })
    expect(!result.ok && result.error).toEqual({ kind: 'CONTACT_REQUEST_NOT_FOUND' })
  })
})
