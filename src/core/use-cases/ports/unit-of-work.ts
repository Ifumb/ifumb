import 'server-only'
import type { AuditLogWriter } from '@/core/use-cases/ports/audit-log-writer'
import type { TreeWriter } from '@/core/use-cases/ports/tree-writer'

/** The writers available inside one transaction. */
export type UnitOfWorkContext = {
  readonly trees: TreeWriter
  readonly auditLog: AuditLogWriter
}

/** Runs writes atomically: a change and its history entry are stored together, or not at all. */
export interface UnitOfWork {
  /** Runs `work` in one transaction; when it throws, every write made through it is undone. */
  runInTransaction<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T>
}
