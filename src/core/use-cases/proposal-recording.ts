import 'server-only'
import type { AuditDiff } from '@/core/entities/audit-change'
import {
  PendingChange,
  type PendingActionKind,
  type PendingTargetType,
} from '@/core/entities/pending-change'
import type { Tree } from '@/core/entities/tree'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PendingChangeAlertMailer } from '@/core/use-cases/ports/pending-change-alert-mailer'
import type { PendingChangeReader } from '@/core/use-cases/ports/pending-change-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

export type RecordProposalDeps = {
  readonly users: UserRepository
  readonly unitOfWork: UnitOfWork
  readonly pendingChanges: PendingChangeReader
  readonly mailer: PendingChangeAlertMailer
  readonly ids: IdGenerator
  readonly clock: Clock
}

export type RecordProposalInput = {
  /** The id the target already has, or will have once approved — see the six write use cases. */
  readonly targetId: string
  readonly targetType: PendingTargetType
  readonly action: PendingActionKind
  readonly diff: AuditDiff
  readonly authorId: string
}

/**
 * Stores an editor's proposal and notifies the owner in the same transaction; the alert email,
 * best effort, follows once that transaction has committed. Returns the new proposal's id.
 * reason: shared by every write use case that can propose instead of apply (module 2.6), so the
 * transaction, the notification and the throttled email are written once, not copied into each.
 */
export async function recordProposal(
  deps: RecordProposalDeps,
  tree: Tree,
  input: RecordProposalInput,
): Promise<string> {
  const now = deps.clock.now()
  const change = PendingChange.propose({
    id: deps.ids.next(),
    treeId: tree.id.value,
    authorId: input.authorId,
    targetType: input.targetType,
    targetId: input.targetId,
    action: input.action,
    snapshotBefore: input.diff.before,
    snapshotAfter: input.diff.after,
    createdAt: now,
  })
  const claimedSlot = await deps.unitOfWork.runInTransaction(async (context) => {
    await context.pendingChanges.propose(change)
    await context.notifications.record({
      id: deps.ids.next(),
      userId: tree.ownerId.value,
      type: 'PENDING_CHANGE_CREATED',
      pendingChangeId: change.id,
      createdAt: now,
    })
    return context.trees.claimPendingAlertSlot(tree.id.value, now)
  })
  if (claimedSlot) await sendAlertBestEffort(deps, tree, input.authorId)
  return change.id
}

async function sendAlertBestEffort(
  deps: RecordProposalDeps,
  tree: Tree,
  authorId: string,
): Promise<void> {
  try {
    const [owner, editor, pending] = await Promise.all([
      deps.users.findById(tree.ownerId),
      deps.users.findById(UserId.fromString(authorId)),
      deps.pendingChanges.pendingForTree(tree.id),
    ])
    if (!owner || !editor) return
    await deps.mailer.sendAlert({
      to: owner.email,
      ownerName: owner.displayName,
      editorName: editor.displayName,
      treeName: tree.name,
      pendingCount: pending.length,
      treeId: tree.id.value,
    })
  } catch (error) {
    // reason: the proposal is already recorded; a failure preparing its alert email must not
    // surface as a failure of the write itself.
    console.error(`Pending change alert could not be prepared: ${describe(error)}`)
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error'
}
