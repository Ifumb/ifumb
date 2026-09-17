import { beforeEach, describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'
import { SendContactRequestUseCase } from '@/core/use-cases/send-contact-request'
import { CONTACT_REQUESTS_NOW, OWNER_ID, REQUESTER_ID, contactRequestWorld } from '@tests/support/contact-request-world'

const MEMBER_ID = 'mbr_awa'

describe('SendContactRequestUseCase', () => {
  let world: ReturnType<typeof contactRequestWorld>

  beforeEach(() => {
    world = contactRequestWorld()
    world.directory.seed(
      { memberId: MEMBER_ID, firstName: 'Awa', lastName: 'Diallo', birthDate: null, ethnicities: [], originRegion: null },
      { treeId: 'tree_diallo', ownerId: OWNER_ID, discoverable: true },
    )
  })

  const send = (requesterId: string, memberId = MEMBER_ID, message: string | null = null) =>
    new SendContactRequestUseCase(world.deps()).execute({ requesterId, memberId, message })

  it('sends a fresh request, notifying the tree owner', async () => {
    const result = await send(REQUESTER_ID, MEMBER_ID, 'Bonjour !')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.sentContactRequests).toMatchObject([
      { treeId: 'tree_diallo', memberId: MEMBER_ID, requesterId: REQUESTER_ID, message: 'Bonjour !' },
    ])
    expect(world.unitOfWork.notifications).toMatchObject([
      { userId: OWNER_ID, type: 'CONTACT_REQUEST_RECEIVED' },
    ])
  })

  it('refuses an unknown member', async () => {
    const result = await send(REQUESTER_ID, 'mbr_unknown')
    expect(!result.ok && result.error).toEqual({ kind: 'MEMBER_NOT_FOUND' })
  })

  it('refuses a member that is not discoverable', async () => {
    world.directory.seed(
      { memberId: 'mbr_hidden', firstName: 'Sekou', lastName: null, birthDate: null, ethnicities: [], originRegion: null },
      { treeId: 'tree_diallo', ownerId: OWNER_ID, discoverable: false },
    )
    const result = await send(REQUESTER_ID, 'mbr_hidden')
    expect(!result.ok && result.error).toEqual({ kind: 'MEMBER_NOT_DISCOVERABLE' })
  })

  it('refuses the tree’s own owner contacting their own member', async () => {
    const result = await send(OWNER_ID)
    expect(!result.ok && result.error).toEqual({ kind: 'CANNOT_CONTACT_OWN_MEMBER' })
  })

  it('refuses a second request while one is already active', async () => {
    world.contactRequests.seed(
      ContactRequest.send({
        id: 'cr_1',
        treeId: 'tree_diallo',
        memberId: MEMBER_ID,
        requesterId: REQUESTER_ID,
        message: null,
        now: CONTACT_REQUESTS_NOW,
      }),
    )
    const result = await send(REQUESTER_ID)
    expect(!result.ok && result.error).toEqual({ kind: 'CONTACT_REQUEST_ALREADY_ACTIVE' })
    expect(world.unitOfWork.sentContactRequests).toEqual([])
  })

  it('resets a refused request instead of failing (legacy bug 5)', async () => {
    const refused = ContactRequest.send({
      id: 'cr_1',
      treeId: 'tree_diallo',
      memberId: MEMBER_ID,
      requesterId: REQUESTER_ID,
      message: null,
      now: new Date('2026-08-01T00:00:00Z'),
    }).respond('REFUSED', new Date('2026-08-02T00:00:00Z'))
    if (!refused.ok) throw new Error('Fixture setup failed')
    world.contactRequests.seed(refused.value)

    const result = await send(REQUESTER_ID, MEMBER_ID, 'Nouvelle tentative')

    expect(result.ok).toBe(true)
    expect(world.unitOfWork.sentContactRequests).toMatchObject([{ id: 'cr_1', status: 'PENDING' }])
  })
})
