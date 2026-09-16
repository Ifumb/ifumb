import 'server-only'
import type { PendingDecision } from '@/core/entities/pending-change'
import { canManage } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import {
  ApprovePendingChangeUseCase,
  type ApprovePendingChangeUseCaseDeps,
} from '@/core/use-cases/approve-pending-change'
import { RejectPendingChangeUseCase } from '@/core/use-cases/reject-pending-change'
import { readableTree, type TreeReadError } from '@/core/use-cases/tree-read-access'

export type ReviewAllInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly decision: PendingDecision
  readonly comment?: string | null
}

export type ReviewAllError = TreeReadError | { readonly kind: 'REVIEW_FORBIDDEN' }

export type ReviewAllOutcome = {
  readonly approved: number
  readonly rejected: number
  readonly skipped: number
}

/**
 * The owner approves or rejects every proposal still pending on a tree, one at a time and each in
 * its own transaction — a proposal that turns out outdated, unreadable or already resolved is
 * skipped, never aborting the rest of the batch (closes the legacy's bug 6).
 */
export class ReviewAllPendingChangesUseCase {
  private readonly approve: ApprovePendingChangeUseCase
  private readonly reject: RejectPendingChangeUseCase

  constructor(private readonly deps: ApprovePendingChangeUseCaseDeps) {
    this.approve = new ApprovePendingChangeUseCase(deps)
    this.reject = new RejectPendingChangeUseCase(deps)
  }

  async execute(input: ReviewAllInput): Promise<Result<ReviewAllOutcome, ReviewAllError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    if (!canManage(access.value.role)) return err({ kind: 'REVIEW_FORBIDDEN' })

    const pending = await this.deps.pendingChanges.pendingForTree(access.value.listing.tree.id)
    const outcome = { approved: 0, rejected: 0, skipped: 0 }
    for (const summary of pending) {
      await this.resolveOne(input, summary.id, outcome)
    }
    return ok(outcome)
  }

  private async resolveOne(
    input: ReviewAllInput,
    pendingChangeId: string,
    outcome: { approved: number; rejected: number; skipped: number },
  ): Promise<void> {
    const target = { treeId: input.treeId, viewerId: input.viewerId, pendingChangeId }
    const result =
      input.decision === 'APPROVED'
        ? await this.approve.execute(target)
        : await this.reject.execute({ ...target, comment: input.comment })
    if (!result.ok) outcome.skipped += 1
    else if (input.decision === 'APPROVED') outcome.approved += 1
    else outcome.rejected += 1
  }
}
