import 'server-only'
import type { PendingChange } from '@/core/entities/pending-change'
import { canManage, type Tree } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import type { PendingChangeReader } from '@/core/use-cases/ports/pending-change-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { readableTree, type TreeReadError } from '@/core/use-cases/tree-read-access'

export type ReviewTarget = {
  readonly treeId: string
  readonly viewerId: string
  readonly pendingChangeId: string
}

export type ReviewAccessError =
  | TreeReadError
  | { readonly kind: 'REVIEW_FORBIDDEN' }
  | { readonly kind: 'PENDING_CHANGE_NOT_FOUND' }

export type ReviewDeps = { readonly trees: TreeReader; readonly pendingChanges: PendingChangeReader }

export type ReviewableChange = { readonly tree: Tree; readonly change: PendingChange }

/**
 * The tree owner and the proposal they are about to resolve — whether it is still `PENDING` is
 * left to `PendingChange.resolve()` itself, the one place that decision already lives.
 */
export async function reviewableChange(
  deps: ReviewDeps,
  target: ReviewTarget,
): Promise<Result<ReviewableChange, ReviewAccessError>> {
  const access = await readableTree(deps.trees, target)
  if (!access.ok) return access
  if (!canManage(access.value.role)) return err({ kind: 'REVIEW_FORBIDDEN' })

  const { tree } = access.value.listing
  const change = await deps.pendingChanges.findById(tree.id, target.pendingChangeId)
  return change ? ok({ tree, change }) : err({ kind: 'PENDING_CHANGE_NOT_FOUND' })
}
