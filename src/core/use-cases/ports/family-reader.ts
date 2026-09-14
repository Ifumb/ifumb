import 'server-only'
import type { Family } from '@/core/entities/family'
import type { TreeId } from '@/core/shared/value-objects/tree-id'

/** Read side of a tree's people and unions. */
export interface FamilyReader {
  /** Every member and union of the tree; an empty family when it has none. */
  loadFamily(treeId: TreeId): Promise<Family>
}
