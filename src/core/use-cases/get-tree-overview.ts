import 'server-only'
import type { TreeAccess } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { TreeListing, TreeReader } from '@/core/use-cases/ports/tree-reader'
import { toTreeSummary, type TreeSummary } from '@/core/use-cases/tree-summary'

export type GetTreeOverviewInput = {
  readonly treeId: string
  /** Absent for an anonymous visitor. */
  readonly viewerId?: string
}

export type GetTreeOverviewError =
  | { readonly kind: 'TREE_NOT_FOUND' }
  | { readonly kind: 'AUTHENTICATION_REQUIRED' }
  | { readonly kind: 'ACCESS_DENIED' }

type GetTreeOverviewDeps = {
  readonly trees: TreeReader
}

export class GetTreeOverviewUseCase {
  constructor(private readonly deps: GetTreeOverviewDeps) {}

  async execute(input: GetTreeOverviewInput): Promise<Result<TreeSummary, GetTreeOverviewError>> {
    const viewerId = input.viewerId ? UserId.fromString(input.viewerId) : undefined
    const listing = await this.deps.trees.findById(TreeId.fromString(input.treeId), viewerId)
    if (!listing) return err({ kind: 'TREE_NOT_FOUND' })

    const access = listing.tree.accessFor({
      userId: viewerId,
      invitationRole: listing.invitationRole,
    })
    return toOverviewResult(listing, access)
  }
}

function toOverviewResult(
  listing: TreeListing,
  access: TreeAccess,
): Result<TreeSummary, GetTreeOverviewError> {
  switch (access.kind) {
    case 'granted':
      return ok(toTreeSummary(listing, access.role))
    case 'authentication-required':
      return err({ kind: 'AUTHENTICATION_REQUIRED' })
    case 'denied':
      return err({ kind: 'ACCESS_DENIED' })
  }
}
