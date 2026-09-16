import 'server-only'
import { canContribute, canManage } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import type {
  PendingChangeReader,
  PendingChangeSummary,
} from '@/core/use-cases/ports/pending-change-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { readableTree, type TreeReadError } from '@/core/use-cases/tree-read-access'

export type GetPendingChangesInput = { readonly treeId: string; readonly viewerId: string }

export type GetPendingChangesError =
  TreeReadError | { readonly kind: 'PENDING_CHANGES_FORBIDDEN' }

export type PendingChangesList = {
  readonly tree: { readonly id: string; readonly name: string }
  /** Whether the viewer reviews every proposal (the owner) or only sees their own (an editor). */
  readonly canReview: boolean
  readonly changes: readonly PendingChangeSummary[]
}

type GetPendingChangesDeps = {
  readonly trees: TreeReader
  readonly pendingChanges: PendingChangeReader
}

/**
 * For the owner, every proposal still waiting for review; for an editor, only their own, whatever
 * its status — a viewer of the tree who contributes nothing has no proposals to see.
 */
export class GetPendingChangesUseCase {
  constructor(private readonly deps: GetPendingChangesDeps) {}

  async execute(
    input: GetPendingChangesInput,
  ): Promise<Result<PendingChangesList, GetPendingChangesError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const { role, listing } = access.value
    if (!canContribute(role)) return err({ kind: 'PENDING_CHANGES_FORBIDDEN' })

    const canReview = canManage(role)
    const changes = canReview
      ? await this.deps.pendingChanges.pendingForTree(listing.tree.id)
      : await this.deps.pendingChanges.byAuthor(listing.tree.id, input.viewerId)
    return ok({ tree: { id: listing.tree.id.value, name: listing.tree.name }, canReview, changes })
  }
}
