import 'server-only'
import type { AuditAction, AuditDiff, AuditFieldChange } from '@/core/entities/audit-change'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'

/** One recorded action on a tree, as stored. */
export type AuditEntry = {
  readonly id: string
  readonly action: AuditAction
  readonly targetType: string
  readonly targetId: string
  readonly author: PersonName
  readonly createdAt: Date
  readonly diff: AuditDiff
}

/** What narrows the audit log; days are calendar days (`YYYY-MM-DD`), both included, in UTC. */
export type AuditLogFilter = {
  readonly action?: AuditAction
  readonly fromDay?: string
  readonly toDay?: string
}

export type AuditLogEntryView = Omit<AuditEntry, 'diff'> & {
  readonly changes: readonly AuditFieldChange[]
}

export type AuditLogPage = {
  readonly tree: { readonly id: string; readonly name: string }
  readonly filter: AuditLogFilter
  readonly entries: readonly AuditLogEntryView[]
  /** Token of the next, older page; null on the last one. */
  readonly nextCursor: string | null
}
