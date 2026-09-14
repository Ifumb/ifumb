import 'server-only'
import { emptyPage, type Page } from '@/core/shared/page'
import { PageRequest } from '@/core/shared/value-objects/page-request'
import type { PublicMemberSummary } from '@/core/use-cases/explore-views'
import type { PublicMemberDirectory } from '@/core/use-cases/ports/public-member-directory'

export const PUBLIC_MEMBERS_PAGE_SIZE = 20

export type SearchPublicMembersInput = { readonly query?: string; readonly page: number }

export type PublicMemberSearch = {
  /** The query searched, trimmed; null when there was nothing to search. */
  readonly query: string | null
  readonly members: Page<PublicMemberSummary>
}

type SearchPublicMembersDeps = { readonly directory: PublicMemberDirectory }

/**
 * Members of public trees matching a query, for anyone.
 * reason: returns the search itself rather than a Result — a public search has no expected failure.
 */
export class SearchPublicMembersUseCase {
  constructor(private readonly deps: SearchPublicMembersDeps) {}

  async execute(input: SearchPublicMembersInput): Promise<PublicMemberSearch> {
    const page = PageRequest.of(input.page, PUBLIC_MEMBERS_PAGE_SIZE)
    const query = input.query?.trim()
    // A blank query would list every public member: nothing is searched until something is typed.
    if (!query) return { query: null, members: emptyPage(page) }
    return { query, members: await this.deps.directory.search(query, page) }
  }
}
