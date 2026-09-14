import 'server-only'
import type { Tree } from '@/core/entities/tree'
import type { AuditRecord } from '@/core/use-cases/ports/audit-log-writer'
import type { UnitOfWork, UnitOfWorkContext } from '@/core/use-cases/ports/unit-of-work'

type Staged = { inserted: Tree[]; updated: Tree[]; records: AuditRecord[] }

/**
 * Test double of the unit of work: writes are staged during the work and kept only when it
 * succeeds, which is what a real transaction guarantees.
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  readonly insertedTrees: Tree[] = []
  readonly updatedTrees: Tree[] = []
  readonly auditRecords: AuditRecord[] = []
  transactions = 0
  private auditFailure = false

  /** Makes the next audit entry fail, as a database error inside the transaction would. */
  failNextAuditRecord(): void {
    this.auditFailure = true
  }

  async runInTransaction<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T> {
    this.transactions += 1
    const staged: Staged = { inserted: [], updated: [], records: [] }
    const result = await work(this.contextFor(staged))
    this.insertedTrees.push(...staged.inserted)
    this.updatedTrees.push(...staged.updated)
    this.auditRecords.push(...staged.records)
    return result
  }

  private contextFor(staged: Staged): UnitOfWorkContext {
    return {
      trees: {
        insert: async (tree) => void staged.inserted.push(tree),
        update: async (tree) => void staged.updated.push(tree),
      },
      auditLog: { record: async (entry) => this.stageRecord(staged, entry) },
    }
  }

  private stageRecord(staged: Staged, entry: AuditRecord): void {
    if (this.auditFailure) {
      this.auditFailure = false
      throw new Error('Simulated audit log failure')
    }
    staged.records.push(entry)
  }
}
