import 'server-only'
import type { TreeRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { TreeListing, TreeReader } from '@/core/use-cases/ports/tree-reader'

export type TreeReadInput = {
  readonly treeId: string
  /** Absent for an anonymous visitor. */
  readonly viewerId?: string
}

export type TreeReadError =
  | { readonly kind: 'TREE_NOT_FOUND' }
  | { readonly kind: 'AUTHENTICATION_REQUIRED' }
  | { readonly kind: 'ACCESS_DENIED' }

export type ReadableTree = {
  readonly listing: TreeListing
  readonly role: TreeRole
}

/** The one access check shared by every use case that reads a tree or its content. */
export async function readableTree(
  trees: TreeReader,
  input: TreeReadInput,
): Promise<Result<ReadableTree, TreeReadError>> {
  const viewerId = input.viewerId ? UserId.fromString(input.viewerId) : undefined
  const listing = await trees.findById(TreeId.fromString(input.treeId), viewerId)
  if (!listing) return err({ kind: 'TREE_NOT_FOUND' })

  const access = listing.tree.accessFor({
    userId: viewerId,
    invitationRole: listing.invitationRole,
  })
  switch (access.kind) {
    case 'granted':
      return ok({ listing, role: access.role })
    case 'authentication-required':
      return err({ kind: 'AUTHENTICATION_REQUIRED' })
    case 'denied':
      return err({ kind: 'ACCESS_DENIED' })
  }
}
