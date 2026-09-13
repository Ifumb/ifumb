import 'server-only'
import type { InvitationRole, Tree } from '@/core/entities/tree'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { UserId } from '@/core/shared/value-objects/user-id'

export type PersonName = {
  readonly firstName: string
  readonly lastName: string
}

/** A tree as seen by one reader, with the facts needed to list or display it. */
export type TreeListing = {
  readonly tree: Tree
  readonly ownerName: PersonName
  readonly memberCount: number
  /** Role the reader holds through an accepted invitation; absent otherwise. */
  readonly invitationRole?: InvitationRole
}

/** Read side of trees. Invitations are only read here as access facts, never modified. */
export interface TreeReader {
  /** Trees the user owns or joined through an accepted invitation, archived ones included. */
  listAccessibleBy(userId: UserId): Promise<TreeListing[]>
  /** The tree, with `readerId`'s invitation role when given; null when no such tree exists. */
  findById(treeId: TreeId, readerId?: UserId): Promise<TreeListing | null>
}
