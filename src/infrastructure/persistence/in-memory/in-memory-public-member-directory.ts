import 'server-only'
import { pageOf, type Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type { PublicMemberSummary } from '@/core/use-cases/explore-views'
import type { PublicMemberDirectory } from '@/core/use-cases/ports/public-member-directory'

/** Test double of the public member directory; counts searches so tests can prove none ran. */
export class InMemoryPublicMemberDirectory implements PublicMemberDirectory {
  private members: readonly PublicMemberSummary[] = []
  private searches = 0

  seed(members: readonly PublicMemberSummary[]): void {
    this.members = members
  }

  get searchCount(): number {
    return this.searches
  }

  async search(query: string, page: PageRequest): Promise<Page<PublicMemberSummary>> {
    this.searches += 1
    const needle = query.toLocaleLowerCase('fr')
    const matching = this.members.filter((member) =>
      searchableTexts(member).some((text) => text.toLocaleLowerCase('fr').includes(needle)),
    )
    return pageOf(matching.slice(page.offset, page.offset + page.size), matching.length, page)
  }
}

function searchableTexts(member: PublicMemberSummary): string[] {
  const { firstName, lastName, clan, originRegion, tribes, ethnicities } = member
  return [firstName, lastName, clan, originRegion, ...tribes, ...ethnicities].filter(
    (text): text is string => text !== null,
  )
}
