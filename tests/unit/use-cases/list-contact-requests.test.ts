import { describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'
import { ListContactRequestsUseCase } from '@/core/use-cases/list-contact-requests'
import { InMemoryContactRequestReader } from '@/infrastructure/persistence/in-memory/in-memory-contact-request-reader'

describe('ListContactRequestsUseCase', () => {
  it('lists both what a visitor received and what they sent', async () => {
    const reader = new InMemoryContactRequestReader()
    const receivedRequest = ContactRequest.send({
      id: 'cr_received',
      treeId: 'tree_diallo',
      memberId: 'mbr_awa',
      requesterId: 'usr_stranger',
      message: null,
      now: new Date('2026-09-17T10:00:00Z'),
    })
    const sentRequest = ContactRequest.send({
      id: 'cr_sent',
      treeId: 'tree_other',
      memberId: 'mbr_sekou',
      requesterId: 'usr_owner',
      message: null,
      now: new Date('2026-09-17T10:00:00Z'),
    })
    reader.seed(receivedRequest)
    reader.seedReceived('usr_owner', {
      contactRequest: receivedRequest,
      requesterName: { firstName: 'Un', lastName: 'Inconnu' },
      requesterEmail: 'stranger@example.com',
      member: { firstName: 'Awa', lastName: 'Diallo', birthDate: null, ethnicities: [], originRegion: null },
    })
    reader.seed(sentRequest)
    reader.seedSent('usr_owner', {
      contactRequest: sentRequest,
      treeName: 'Famille Touré',
      ownerName: { firstName: 'Sekou', lastName: 'Touré' },
      ownerEmail: 'sekou@example.com',
      member: { firstName: 'Sekou', lastName: 'Touré', birthDate: null, ethnicities: [], originRegion: null },
    })

    const result = await new ListContactRequestsUseCase({ contactRequests: reader }).execute('usr_owner')

    expect(result.received).toMatchObject([{ contactRequest: { id: 'cr_received' } }])
    expect(result.sent).toMatchObject([{ contactRequest: { id: 'cr_sent' } }])
  })
})
