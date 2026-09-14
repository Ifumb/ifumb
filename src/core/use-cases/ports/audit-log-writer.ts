import 'server-only'
import type { AuditAction, AuditDiff } from '@/core/entities/audit-change'

/** One entry to add to a tree's history. */
export type AuditRecord = {
  readonly id: string
  readonly treeId: string
  readonly authorId: string
  readonly action: AuditAction
  readonly targetType: 'TREE' | 'MEMBER' | 'UNION'
  readonly targetId: string
  readonly diff: AuditDiff
  readonly createdAt: Date
}

/** Write side of the audit log: entries are only ever added. */
export interface AuditLogWriter {
  record(entry: AuditRecord): Promise<void>
}
