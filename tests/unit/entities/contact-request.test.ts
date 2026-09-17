import { describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'

const NOW = new Date('2026-09-17T10:00:00Z')
const LATER = new Date('2026-09-18T10:00:00Z')

function aPendingRequest() {
  return ContactRequest.send({
    id: 'cr_1',
    treeId: 'tree_diallo',
    memberId: 'mbr_awa',
    requesterId: 'usr_requester',
    message: '  Bonjour, je pense être un cousin.  ',
    now: NOW,
  })
}

describe('ContactRequest', () => {
  it('starts PENDING, with its message trimmed', () => {
    const request = aPendingRequest()
    expect([request.status, request.message]).toEqual(['PENDING', 'Bonjour, je pense être un cousin.'])
  })

  it('turns a blank message into null', () => {
    const request = ContactRequest.send({
      id: 'cr_1',
      treeId: 'tree_diallo',
      memberId: 'mbr_awa',
      requesterId: 'usr_requester',
      message: '   ',
      now: NOW,
    })
    expect(request.message).toBeNull()
  })

  it('is active while PENDING or ACCEPTED, not once REFUSED or WITHDRAWN', () => {
    const accepted = aPendingRequest().respond('ACCEPTED', LATER)
    const refused = aPendingRequest().respond('REFUSED', LATER)
    const withdrawn = aPendingRequest().withdraw(LATER)
    expect([
      aPendingRequest().isActive,
      accepted.ok && accepted.value.isActive,
      refused.ok && refused.value.isActive,
      withdrawn.ok && withdrawn.value.isActive,
    ]).toEqual([true, true, false, false])
  })

  it('refuses to respond to a request already resolved', () => {
    const refused = aPendingRequest().respond('REFUSED', LATER)
    const again = refused.ok && refused.value.respond('ACCEPTED', LATER)
    expect(again && !again.ok && again.error).toEqual({ kind: 'CONTACT_REQUEST_ALREADY_RESOLVED' })
  })

  it('refuses to withdraw a request already resolved', () => {
    const accepted = aPendingRequest().respond('ACCEPTED', LATER)
    const withdrawn = accepted.ok && accepted.value.withdraw(LATER)
    expect(withdrawn && !withdrawn.ok && withdrawn.error).toEqual({
      kind: 'CONTACT_REQUEST_ALREADY_RESOLVED',
    })
  })
})
