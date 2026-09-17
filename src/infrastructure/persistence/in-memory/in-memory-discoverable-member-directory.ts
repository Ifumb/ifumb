import 'server-only'
import { pageOf, type Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type {
  DiscoverableMemberDirectory,
  DiscoverableMemberLookup,
  DiscoverableMemberSummary,
} from '@/core/use-cases/ports/discoverable-member-directory'

/** Test double of the discoverable member directory. */
export class InMemoryDiscoverableMemberDirectory implements DiscoverableMemberDirectory {
  private readonly members: DiscoverableMemberSummary[] = []
  private readonly lookups = new Map<string, DiscoverableMemberLookup>()

  seed(member: DiscoverableMemberSummary, lookup: DiscoverableMemberLookup): void {
    this.members.push(member)
    this.lookups.set(member.memberId, lookup)
  }

  async search(query: string, page: PageRequest): Promise<Page<DiscoverableMemberSummary>> {
    const needle = query.toLowerCase()
    const matches = this.members.filter((member) =>
      [member.firstName, member.lastName, ...member.ethnicities, member.originRegion]
        .filter((text): text is string => !!text)
        .some((text) => text.toLowerCase().includes(needle)),
    )
    const items = matches.slice(page.offset, page.offset + page.size)
    return pageOf(items, matches.length, page)
  }

  async findDiscoverable(memberId: string): Promise<DiscoverableMemberLookup | null> {
    return this.lookups.get(memberId) ?? null
  }
}
