import 'server-only'
import type { ContactRequest, ContactRequestStatus } from '@/core/entities/contact-request'
import type {
  ContactRequestMember,
  ContactRequestReader,
  ReceivedContactRequestView,
  SentContactRequestView,
} from '@/core/use-cases/ports/contact-request-reader'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'

type SeededReceived = {
  readonly contactRequest: ContactRequest
  readonly requesterName: PersonName
  readonly requesterEmail: string
  readonly member: ContactRequestMember
}

type SeededSent = {
  readonly contactRequest: ContactRequest
  readonly treeName: string
  readonly ownerName: PersonName
  readonly ownerEmail: string
  readonly member: ContactRequestMember
}

/** Test double of the contact request reader. */
export class InMemoryContactRequestReader implements ContactRequestReader {
  private readonly byId = new Map<string, ContactRequest>()
  private readonly received = new Map<string, SeededReceived>()
  private readonly sent = new Map<string, SeededSent>()

  seed(contactRequest: ContactRequest): void {
    this.byId.set(contactRequest.id, contactRequest)
  }

  /** Seeds what `listReceivedBy(ownerId)` shows for this request; `seed` it too, separately. */
  seedReceived(ownerId: string, view: Omit<SeededReceived, 'requesterEmail'> & { requesterEmail: string }): void {
    this.received.set(`${ownerId}:${view.contactRequest.id}`, view)
  }

  /** Seeds what `listSentBy(requesterId)` shows for this request; `seed` it too, separately. */
  seedSent(requesterId: string, view: SeededSent): void {
    this.sent.set(`${requesterId}:${view.contactRequest.id}`, view)
  }

  async findById(id: string): Promise<ContactRequest | null> {
    return this.byId.get(id) ?? null
  }

  async findByRequesterAndMember(requesterId: string, memberId: string): Promise<ContactRequest | null> {
    const match = [...this.byId.values()].find(
      (request) => request.requesterId === requesterId && request.memberId === memberId,
    )
    return match ?? null
  }

  async listReceivedBy(userId: string): Promise<readonly ReceivedContactRequestView[]> {
    return [...this.received.entries()]
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([, view]) => ({
        ...view,
        requesterEmail: view.contactRequest.status === 'ACCEPTED' ? view.requesterEmail : null,
      }))
  }

  async listSentBy(userId: string): Promise<readonly SentContactRequestView[]> {
    return [...this.sent.entries()]
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([, view]) => ({
        ...view,
        ownerEmail: view.contactRequest.status === 'ACCEPTED' ? view.ownerEmail : null,
      }))
  }

  async findStatusesForRequester(
    requesterId: string,
    memberIds: readonly string[],
  ): Promise<ReadonlyMap<string, ContactRequestStatus>> {
    const ids = new Set(memberIds)
    const entries = [...this.byId.values()]
      .filter((request) => request.requesterId === requesterId && ids.has(request.memberId))
      .map((request): [string, ContactRequestStatus] => [request.memberId, request.status])
    return new Map(entries)
  }
}
