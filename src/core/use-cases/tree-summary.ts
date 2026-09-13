import 'server-only'
import type { TreeRole, TreeVisibility } from '@/core/entities/tree'
import type { PersonName, TreeListing } from '@/core/use-cases/ports/tree-reader'

/** A tree as the presentation layer may show it to one reader. */
export type TreeSummary = {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly visibility: TreeVisibility
  readonly role: TreeRole
  readonly ownerName: PersonName
  readonly memberCount: number
  readonly updatedAt: Date
}

export function toTreeSummary(listing: TreeListing, role: TreeRole): TreeSummary {
  const { tree } = listing
  return {
    id: tree.id.value,
    name: tree.name,
    description: tree.description,
    visibility: tree.visibility,
    role,
    ownerName: listing.ownerName,
    memberCount: listing.memberCount,
    updatedAt: tree.updatedAt,
  }
}
