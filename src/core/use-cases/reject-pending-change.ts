import 'server-only'
import type { ChangeAlreadyResolved } from '@/core/entities/pending-change'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import {
  reviewableChange,
  type ReviewAccessError,
  type ReviewDeps,
  type ReviewTarget,
} from '@/core/use-cases/pending-change-review-access'

export type RejectPendingChangeInput = ReviewTarget & { readonly comment?: string | null }

export type RejectPendingChangeError = ReviewAccessError | ChangeAlreadyResolved

type RejectPendingChangeDeps = ReviewDeps & {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner rejects a proposal, with an optional comment its author will see. */
export class RejectPendingChangeUseCase {
  constructor(private readonly deps: RejectPendingChangeDeps) {}

  async execute(
    input: RejectPendingChangeInput,
  ): Promise<Result<{ rejected: true }, RejectPendingChangeError>> {
    const found = await reviewableChange(this.deps, input)
    if (!found.ok) return found
    const { tree, change } = found.value

    const now = this.deps.clock.now()
    const resolved = change.resolve('REJECTED', {
      resolvedById: input.viewerId,
      now,
      comment: input.comment,
    })
    if (!resolved.ok) return resolved

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.pendingChanges.resolve(resolved.value)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: tree.id.value,
        authorId: input.viewerId,
        action: 'PENDING_CHANGE_REJECTED',
        targetType: change.targetType,
        targetId: change.targetId,
        diff: { before: change.snapshotBefore, after: change.snapshotAfter },
        createdAt: now,
      })
      await context.notifications.record({
        id: this.deps.ids.next(),
        userId: change.authorId,
        type: 'CHANGE_REJECTED',
        pendingChangeId: change.id,
        createdAt: now,
      })
    })
    return ok({ rejected: true })
  }
}
