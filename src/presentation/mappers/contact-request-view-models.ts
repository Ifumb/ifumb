import type { ContactRequestsList } from '@/core/use-cases/list-contact-requests'
import type {
  ContactRequestMember,
  ReceivedContactRequestView,
  SentContactRequestView,
} from '@/core/use-cases/ports/contact-request-reader'
import { CONTACT_REQUEST_STATUS_LABELS } from '@/presentation/labels/contact-request-labels'

export type ReceivedRequestViewModel = {
  readonly id: string
  readonly requesterName: string
  readonly requesterEmail: string | null
  readonly memberDescription: string
  readonly message: string | null
  readonly statusLabel: string
  readonly canRespond: boolean
  readonly createdAtIso: string
}

export type SentRequestViewModel = {
  readonly id: string
  readonly treeName: string
  readonly ownerName: string
  readonly ownerEmail: string | null
  readonly memberDescription: string
  readonly message: string | null
  readonly statusLabel: string
  readonly canWithdraw: boolean
  readonly createdAtIso: string
}

export type ContactRequestsViewModel = {
  readonly received: readonly ReceivedRequestViewModel[]
  readonly sent: readonly SentRequestViewModel[]
}

export function toContactRequestsViewModel(list: ContactRequestsList): ContactRequestsViewModel {
  return { received: list.received.map(toReceived), sent: list.sent.map(toSent) }
}

function toReceived(view: ReceivedContactRequestView): ReceivedRequestViewModel {
  const { contactRequest } = view
  return {
    id: contactRequest.id,
    requesterName: fullName(view.requesterName),
    requesterEmail: view.requesterEmail,
    memberDescription: describeMember(view.member),
    message: contactRequest.message,
    statusLabel: CONTACT_REQUEST_STATUS_LABELS[contactRequest.status],
    canRespond: contactRequest.status === 'PENDING',
    createdAtIso: contactRequest.createdAt.toISOString(),
  }
}

function toSent(view: SentContactRequestView): SentRequestViewModel {
  const { contactRequest } = view
  return {
    id: contactRequest.id,
    treeName: view.treeName,
    ownerName: fullName(view.ownerName),
    ownerEmail: view.ownerEmail,
    memberDescription: describeMember(view.member),
    message: contactRequest.message,
    statusLabel: CONTACT_REQUEST_STATUS_LABELS[contactRequest.status],
    canWithdraw: contactRequest.status === 'PENDING',
    createdAtIso: contactRequest.createdAt.toISOString(),
  }
}

function fullName(person: { firstName: string; lastName: string | null }): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}

function describeMember(member: ContactRequestMember): string {
  const born = member.birthDate ? `né(e) en ${member.birthDate.year}` : null
  const name = fullName(member)
  const details = [born, ...member.ethnicities, member.originRegion].filter(Boolean).join(', ')
  return details ? `${name} (${details})` : name
}
