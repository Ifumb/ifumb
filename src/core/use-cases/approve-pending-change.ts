import 'server-only'
import type { ChangeAlreadyResolved } from '@/core/entities/pending-change'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { discardPhotoFile } from '@/core/use-cases/member-photo-files'
import {
  applyMemberChange,
  applyUnionChange,
  type ApplicationError,
} from '@/core/use-cases/pending-change-application'
import {
  reviewableChange,
  type ReviewAccessError,
  type ReviewDeps,
  type ReviewTarget,
} from '@/core/use-cases/pending-change-review-access'

export type ApprovePendingChangeError = ReviewAccessError | ChangeAlreadyResolved | ApplicationError

export type ApprovePendingChangeUseCaseDeps = ReviewDeps & {
  readonly families: FamilyReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
  readonly storage: PhotoStorage | null
}

/**
 * The owner approves a proposal: its JSON is revalidated and applied through the same writers a
 * direct write uses (never applied raw), journalled and notified to its author, all in one
 * transaction — closing the legacy's bugs 1 and 4.
 */
export class ApprovePendingChangeUseCase {
  constructor(private readonly deps: ApprovePendingChangeUseCaseDeps) {}

  async execute(
    target: ReviewTarget,
  ): Promise<Result<{ applied: true }, ApprovePendingChangeError>> {
    const found = await reviewableChange(this.deps, target)
    if (!found.ok) return found
    const { tree, change } = found.value

    const family = await this.deps.families.loadFamily(tree.id)
    const application =
      change.targetType === 'MEMBER'
        ? applyMemberChange(change, family, tree.id.value)
        : applyUnionChange(change, family, tree.id.value)
    if (!application.ok) return application

    const now = this.deps.clock.now()
    const resolved = change.resolve('APPROVED', { resolvedById: target.viewerId, now })
    if (!resolved.ok) return resolved

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await application.value.write(context)
      await context.pendingChanges.resolve(resolved.value)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: tree.id.value,
        authorId: target.viewerId,
        action: 'PENDING_CHANGE_APPROVED',
        targetType: change.targetType,
        targetId: change.targetId,
        diff: { before: change.snapshotBefore, after: change.snapshotAfter },
        createdAt: now,
      })
      await context.notifications.record({
        id: this.deps.ids.next(),
        userId: change.authorId,
        type: 'CHANGE_APPROVED',
        pendingChangeId: change.id,
        createdAt: now,
      })
    })

    await discardPhotoFile(this.deps.storage, application.value.photoToDiscard)
    return ok({ applied: true })
  }
}
