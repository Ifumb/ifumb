import 'server-only'
import { describeAuditDiff, type AuditAction } from '@/core/entities/audit-change'
import { canContribute } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { AuditCursor } from '@/core/shared/value-objects/audit-cursor'
import type {
  AuditEntry,
  AuditLogEntryView,
  AuditLogFilter,
  AuditLogPage,
} from '@/core/use-cases/audit-log-views'
import type { AuditLogReader } from '@/core/use-cases/ports/audit-log-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export const AUDIT_LOG_PAGE_SIZE = 20

export type GetAuditLogInput = TreeReadInput & {
  readonly action?: AuditAction
  readonly fromDay?: string
  readonly toDay?: string
  /** Token of the page to show; the most recent entries when absent or unreadable. */
  readonly cursor?: string
}

export type GetAuditLogError = TreeReadError | { readonly kind: 'AUDIT_LOG_FORBIDDEN' }

type GetAuditLogDeps = {
  readonly trees: TreeReader
  readonly auditLog: AuditLogReader
}

/** A tree's history, for those who contribute to it. */
export class GetAuditLogUseCase {
  constructor(private readonly deps: GetAuditLogDeps) {}

  async execute(input: GetAuditLogInput): Promise<Result<AuditLogPage, GetAuditLogError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    if (!canContribute(access.value.role)) return err({ kind: 'AUDIT_LOG_FORBIDDEN' })

    const { tree } = access.value.listing
    const filter = filterOf(input)
    const cursor = input.cursor ? AuditCursor.parse(input.cursor) : null
    const slice = await this.deps.auditLog.page(tree.id, filter, cursor, AUDIT_LOG_PAGE_SIZE)
    return ok({
      tree: { id: tree.id.value, name: tree.name },
      filter,
      entries: slice.entries.map(toEntryView),
      nextCursor: slice.next?.token ?? null,
    })
  }
}

function filterOf({ action, fromDay, toDay }: GetAuditLogInput): AuditLogFilter {
  return { ...(action && { action }), ...(fromDay && { fromDay }), ...(toDay && { toDay }) }
}

function toEntryView({ diff, ...entry }: AuditEntry): AuditLogEntryView {
  return { ...entry, changes: describeAuditDiff(diff) }
}
