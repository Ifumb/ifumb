import 'server-only'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { toTreeSummary, type TreeSummary } from '@/core/use-cases/tree-summary'

export type ListUserTreesInput = {
  readonly userId: string
}

type ListUserTreesDeps = {
  readonly trees: TreeReader
}

export class ListUserTreesUseCase {
  constructor(private readonly deps: ListUserTreesDeps) {}

  /**
   * The user's active trees, most recently updated first.
   * reason: returns the list itself rather than a Result — a query with no expected failure has
   * no error kind to report, and `Result<T, never>` would force callers to handle the impossible.
   */
  async execute(input: ListUserTreesInput): Promise<TreeSummary[]> {
    const userId = UserId.fromString(input.userId)
    const listings = await this.deps.trees.listAccessibleBy(userId)

    return listings
      .filter(({ tree }) => !tree.isArchived)
      .flatMap((listing) => {
        const access = listing.tree.accessFor({ userId, invitationRole: listing.invitationRole })
        return access.kind === 'granted' ? [toTreeSummary(listing, access.role)] : []
      })
      .sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime())
  }
}
