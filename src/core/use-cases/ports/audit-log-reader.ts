import 'server-only'
import type { AuditCursor } from '@/core/shared/value-objects/audit-cursor'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { AuditEntry, AuditLogFilter } from '@/core/use-cases/audit-log-views'

export type AuditLogSlice = {
  readonly entries: readonly AuditEntry[]
  /** Where the next, older slice starts; null when nothing is left. */
  readonly next: AuditCursor | null
}

/** Read side of a tree's audit log. */
export interface AuditLogReader {
  /** Up to `size` entries, newest first, older than `cursor` when one is given. */
  page(
    treeId: TreeId,
    filter: AuditLogFilter,
    cursor: AuditCursor | null,
    size: number,
  ): Promise<AuditLogSlice>
}
