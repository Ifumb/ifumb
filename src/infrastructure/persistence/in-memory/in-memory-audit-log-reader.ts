import 'server-only'
import { AuditCursor } from '@/core/shared/value-objects/audit-cursor'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { AuditEntry, AuditLogFilter } from '@/core/use-cases/audit-log-views'
import type { AuditLogReader, AuditLogSlice } from '@/core/use-cases/ports/audit-log-reader'

/** Test double of the audit log reader; remembers the last filter so tests can inspect it. */
export class InMemoryAuditLogReader implements AuditLogReader {
  private readonly entriesByTree = new Map<string, readonly AuditEntry[]>()
  lastFilter: AuditLogFilter | null = null

  seed(treeId: string, entries: readonly AuditEntry[]): void {
    this.entriesByTree.set(treeId, [...entries].sort(newestFirst))
  }

  async page(
    treeId: TreeId,
    filter: AuditLogFilter,
    cursor: AuditCursor | null,
    size: number,
  ): Promise<AuditLogSlice> {
    this.lastFilter = filter
    const entries = (this.entriesByTree.get(treeId.value) ?? []).filter(
      (entry) => matches(entry, filter) && (!cursor || isOlderThan(entry, cursor)),
    )
    const kept = entries.slice(0, size)
    const last = kept.at(-1)
    return {
      entries: kept,
      next: entries.length > size && last ? AuditCursor.of(last.createdAt, last.id) : null,
    }
  }
}

function newestFirst(a: AuditEntry, b: AuditEntry): number {
  return b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id)
}

function isOlderThan(entry: AuditEntry, cursor: AuditCursor): boolean {
  const difference = entry.createdAt.getTime() - cursor.createdAt.getTime()
  return difference < 0 || (difference === 0 && entry.id < cursor.id)
}

function matches(entry: AuditEntry, { action, fromDay, toDay }: AuditLogFilter): boolean {
  const day = entry.createdAt.toISOString().slice(0, 10)
  return (
    (!action || entry.action === action) && (!fromDay || day >= fromDay) && (!toDay || day <= toDay)
  )
}
