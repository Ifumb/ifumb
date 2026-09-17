import 'server-only'
import type { ContactRequest, ContactRequestStatus } from '@/core/entities/contact-request'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'

/** The concerned member, reduced to what a contact request ever needs to show about them. */
export type ContactRequestMember = {
  readonly firstName: string
  readonly lastName: string | null
  readonly birthDate: PartialDate | null
  readonly ethnicities: readonly string[]
  readonly originRegion: string | null
}

export type ReceivedContactRequestView = {
  readonly contactRequest: ContactRequest
  readonly requesterName: PersonName
  /** Only once `ACCEPTED` — never shown to the tree owner before they decide (closes a legacy
   * privacy gap: the API used to return it regardless of status). */
  readonly requesterEmail: string | null
  readonly member: ContactRequestMember
}

export type SentContactRequestView = {
  readonly contactRequest: ContactRequest
  readonly treeName: string
  readonly ownerName: PersonName
  /** Only once `ACCEPTED`, same reasoning as `requesterEmail`. */
  readonly ownerEmail: string | null
  readonly member: ContactRequestMember
}

/** Read side of contact requests. */
export interface ContactRequestReader {
  findById(id: string): Promise<ContactRequest | null>
  findByRequesterAndMember(requesterId: string, memberId: string): Promise<ContactRequest | null>
  /** For a tree owner: every request received across their trees, newest first. */
  listReceivedBy(userId: string): Promise<readonly ReceivedContactRequestView[]>
  /** For a requester: every request they sent, newest first. */
  listSentBy(userId: string): Promise<readonly SentContactRequestView[]>
  /**
   * For merging into search results, one query for the whole page rather than one per row: which
   * of these members the requester already has an active (non-terminal) request for.
   */
  findStatusesForRequester(
    requesterId: string,
    memberIds: readonly string[],
  ): Promise<ReadonlyMap<string, ContactRequestStatus>>
}
