import 'server-only'
import { emptyPage, type Page } from '@/core/shared/page'
import { PageRequest } from '@/core/shared/value-objects/page-request'
import type { ContactRequestStatus } from '@/core/entities/contact-request'
import type { ContactRequestReader } from '@/core/use-cases/ports/contact-request-reader'
import type {
  DiscoverableMemberDirectory,
  DiscoverableMemberSummary,
} from '@/core/use-cases/ports/discoverable-member-directory'

export const DISCOVERABLE_MEMBERS_PAGE_SIZE = 20

export type SearchDiscoverableMembersInput = {
  readonly query?: string
  readonly page: number
  /** Absent for an anonymous visitor: no contact status to show them, they cannot send one anyway. */
  readonly viewerId?: string
}

export type DiscoverableMemberResult = DiscoverableMemberSummary & {
  /** The viewer's own request for this member, if they already sent one. */
  readonly contactStatus: ContactRequestStatus | null
}

export type DiscoverableMemberSearch = {
  readonly query: string | null
  readonly members: Page<DiscoverableMemberResult>
}

type SearchDiscoverableMembersDeps = {
  readonly directory: DiscoverableMemberDirectory
  readonly contactRequests: ContactRequestReader
}

/**
 * Discoverable members of private/shared trees matching a query — shown as its own section
 * alongside `SearchPublicMembersUseCase`'s public results, not merged into one interleaved page:
 * the two sources page independently, so each keeps an honest total (closes the legacy bug where
 * the reported total was really just the page size).
 */
export class SearchDiscoverableMembersUseCase {
  constructor(private readonly deps: SearchDiscoverableMembersDeps) {}

  async execute(input: SearchDiscoverableMembersInput): Promise<DiscoverableMemberSearch> {
    const page = PageRequest.of(input.page, DISCOVERABLE_MEMBERS_PAGE_SIZE)
    const query = input.query?.trim()
    if (!query) return { query: null, members: emptyPage(page) }

    const results = await this.deps.directory.search(query, page)
    const statuses = input.viewerId
      ? await this.deps.contactRequests.findStatusesForRequester(
          input.viewerId,
          results.items.map((member) => member.memberId),
        )
      : new Map<string, ContactRequestStatus>()
    return {
      query,
      members: {
        ...results,
        items: results.items.map((member) => ({
          ...member,
          contactStatus: statuses.get(member.memberId) ?? null,
        })),
      },
    }
  }
}
