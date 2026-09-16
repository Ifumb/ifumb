import { describeAuditDiff } from '@/core/entities/audit-change'
import type { PendingChangesList } from '@/core/use-cases/get-pending-changes'
import type { PendingChangeSummary } from '@/core/use-cases/ports/pending-change-reader'
import { HIDDEN_AUDIT_FIELDS } from '@/presentation/labels/audit-labels'
import {
  PENDING_ACTION_LABELS,
  PENDING_STATUS_LABELS,
  PENDING_TARGET_TYPE_LABELS,
} from '@/presentation/labels/pending-change-labels'
import { toChange, type AuditChangeViewModel } from '@/presentation/mappers/audit-log-view-models'

export type PendingChangeItemViewModel = {
  readonly id: string
  readonly title: string
  readonly statusLabel: string
  readonly isPending: boolean
  readonly authorName: string
  readonly createdAtIso: string
  readonly changes: readonly AuditChangeViewModel[]
}

export type PendingHref = `/tree/${string}/pending`

export type PendingChangesViewModel = {
  readonly treeId: string
  readonly treeName: string
  readonly treeHref: `/tree/${string}`
  readonly pendingHref: PendingHref
  readonly canReview: boolean
  readonly status: string
  readonly items: readonly PendingChangeItemViewModel[]
}

/** Reuses the audit log's own field labels and formatting: a proposal's diff reads the same way. */
export function toPendingChangesViewModel(list: PendingChangesList): PendingChangesViewModel {
  return {
    treeId: list.tree.id,
    treeName: list.tree.name,
    treeHref: `/tree/${list.tree.id}`,
    pendingHref: `/tree/${list.tree.id}/pending`,
    canReview: list.canReview,
    status: statusOf(list.changes.length, list.canReview),
    items: list.changes.map(toItem),
  }
}

function statusOf(count: number, canReview: boolean): string {
  if (count > 0) return `${count} modification${count > 1 ? 's' : ''} en attente.`
  return canReview ? 'Aucune modification en attente.' : 'Vous n’avez fait aucune proposition.'
}

function toItem(change: PendingChangeSummary): PendingChangeItemViewModel {
  const diff = { before: change.snapshotBefore, after: change.snapshotAfter }
  const target = PENDING_TARGET_TYPE_LABELS[change.targetType]
  const action = PENDING_ACTION_LABELS[change.action]
  return {
    id: change.id,
    title: `${action} — ${target}`,
    statusLabel: PENDING_STATUS_LABELS[change.status],
    isPending: change.status === 'PENDING',
    authorName: change.authorName,
    createdAtIso: change.createdAt.toISOString(),
    changes: describeAuditDiff(diff)
      .filter((fieldChange) => !HIDDEN_AUDIT_FIELDS.has(fieldChange.field))
      .map(toChange),
  }
}
