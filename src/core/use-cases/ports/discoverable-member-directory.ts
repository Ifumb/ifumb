import 'server-only'
import type { Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'

/** A discoverable member of a non-public tree, reduced to what a stranger may ever see of them. */
export type DiscoverableMemberSummary = {
  readonly memberId: string
  readonly firstName: string
  readonly lastName: string | null
  readonly birthDate: PartialDate | null
  readonly ethnicities: readonly string[]
  readonly originRegion: string | null
}

/**
 * Read side of members who opted into being found: `discoverable`, on a `PRIVATE` or `SHARED`
 * tree (never `PUBLIC` — those are `PublicMemberDirectory`'s). Never exposes a tree's name or id:
 * the only action available on a result is sending its owner a contact request.
 */
export type DiscoverableMemberLookup = {
  readonly treeId: string
  readonly ownerId: string
  readonly discoverable: boolean
}

export interface DiscoverableMemberDirectory {
  search(query: string, page: PageRequest): Promise<Page<DiscoverableMemberSummary>>
  /** For sending a contact request: does this member exist, is it discoverable, who owns its tree. */
  findDiscoverable(memberId: string): Promise<DiscoverableMemberLookup | null>
}
