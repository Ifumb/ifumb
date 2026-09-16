import 'server-only'
import type { AuditSnapshot } from '@/core/entities/audit-change'
import type {
  PendingActionKind,
  PendingStatus,
  PendingTargetType,
} from '@/core/entities/pending-change'
import type { TreeId } from '@/core/shared/value-objects/tree-id'

/** @deprecated kept as the name every existing caller of `pendingTargets` already uses. */
export type PendingAction = PendingActionKind

export type PendingChangeSummary = {
  readonly id: string
  readonly authorId: string
  readonly authorName: string
  readonly targetType: PendingTargetType
  readonly targetId: string
  readonly action: PendingActionKind
  readonly snapshotBefore: AuditSnapshot | null
  readonly snapshotAfter: AuditSnapshot | null
  readonly status: PendingStatus
  readonly createdAt: Date
}

/** Read side of the changes editors proposed and the owner has not reviewed yet. */
export interface PendingChangeReader {
  /** The pending action per target (member or union id); the latest one when there are several. */
  pendingTargets(treeId: TreeId): Promise<ReadonlyMap<string, PendingAction>>
  /** Every proposal still PENDING on this tree, newest first — for the owner's review list. */
  pendingForTree(treeId: TreeId): Promise<readonly PendingChangeSummary[]>
  /** One author's own proposals on this tree, any status, newest first. */
  byAuthor(treeId: TreeId, authorId: string): Promise<readonly PendingChangeSummary[]>
}
