import type { ContactRequestStatus } from '@/core/entities/contact-request'
import type {
  DiscoverableMemberResult,
  DiscoverableMemberSearch,
} from '@/core/use-cases/search-discoverable-members'
import { discoverableMembersHref } from '@/presentation/explore/explore-urls'
import { CONTACT_REQUEST_STATUS_LABELS } from '@/presentation/labels/contact-request-labels'
import {
  toPaginationViewModel,
  type PaginationViewModel,
} from '@/presentation/mappers/pagination-view-models'

export type DiscoverableMemberRowViewModel = {
  readonly memberId: string
  readonly name: string
  readonly details: string | null
  /** A request may be (re)sent whenever there is none, or the last one ended without success. */
  readonly canSend: boolean
  readonly statusLabel: string | null
}

export type DiscoverableMemberSearchViewModel = {
  readonly query?: string
  readonly status: string
  readonly members: readonly DiscoverableMemberRowViewModel[]
  readonly pagination: PaginationViewModel | null
}

export function toDiscoverableMemberSearchViewModel(
  search: DiscoverableMemberSearch,
): DiscoverableMemberSearchViewModel {
  const query = search.query ?? undefined
  const { members } = search
  return {
    query,
    status: statusOf(members.total, query),
    members: members.items.map(toRow),
    pagination: toPaginationViewModel(members, (page) => discoverableMembersHref(query, page)),
  }
}

function statusOf(total: number, query: string | undefined): string {
  if (!query) return ''
  if (total === 0) return `Aucun membre découvrable trouvé pour « ${query} ».`
  return `${total} membre${total > 1 ? 's' : ''} découvrable${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''} pour « ${query} ».`
}

function toRow(member: DiscoverableMemberResult): DiscoverableMemberRowViewModel {
  const born = member.birthDate ? `Né(e) en ${member.birthDate.year}` : null
  const details = [born, ...member.ethnicities, member.originRegion].filter(Boolean).join(' · ')
  const { canSend, statusLabel } = availabilityOf(member.contactStatus)
  return {
    memberId: member.memberId,
    name: [member.firstName, member.lastName].filter(Boolean).join(' '),
    details: details || null,
    canSend,
    statusLabel,
  }
}

/** `PENDING`/`ACCEPTED` block a new request; `REFUSED`/`WITHDRAWN` (or none yet) allow one. */
function availabilityOf(status: ContactRequestStatus | null): {
  canSend: boolean
  statusLabel: string | null
} {
  if (status === null) return { canSend: true, statusLabel: null }
  const blocking = status === 'PENDING' || status === 'ACCEPTED'
  return { canSend: !blocking, statusLabel: CONTACT_REQUEST_STATUS_LABELS[status] }
}
