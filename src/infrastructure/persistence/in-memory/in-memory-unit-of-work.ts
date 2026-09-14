import 'server-only'
import type { Member } from '@/core/entities/member'
import type { Tree } from '@/core/entities/tree'
import type { AuditRecord } from '@/core/use-cases/ports/audit-log-writer'
import type { UnitOfWork, UnitOfWorkContext } from '@/core/use-cases/ports/unit-of-work'

type InsertedMember = { readonly treeId: string; readonly member: Member }

type Writes = {
  insertedTrees: Tree[]
  updatedTrees: Tree[]
  insertedMembers: InsertedMember[]
  updatedMembers: Member[]
  deletedMemberIds: string[]
  auditRecords: AuditRecord[]
}

const noWrites = (): Writes => ({
  insertedTrees: [],
  updatedTrees: [],
  insertedMembers: [],
  updatedMembers: [],
  deletedMemberIds: [],
  auditRecords: [],
})

/**
 * Test double of the unit of work: writes are staged during the work and kept only when it
 * succeeds, which is what a real transaction guarantees.
 */
export class InMemoryUnitOfWork implements UnitOfWork, Readonly<Writes> {
  private readonly committed = noWrites()
  transactions = 0
  private auditFailure = false

  get insertedTrees() {
    return this.committed.insertedTrees
  }
  get updatedTrees() {
    return this.committed.updatedTrees
  }
  get insertedMembers() {
    return this.committed.insertedMembers
  }
  get updatedMembers() {
    return this.committed.updatedMembers
  }
  get deletedMemberIds() {
    return this.committed.deletedMemberIds
  }
  get auditRecords() {
    return this.committed.auditRecords
  }

  /** Makes the next audit entry fail, as a database error inside the transaction would. */
  failNextAuditRecord(): void {
    this.auditFailure = true
  }

  async runInTransaction<T>(work: (context: UnitOfWorkContext) => Promise<T>): Promise<T> {
    this.transactions += 1
    const staged = noWrites()
    const result = await work(this.contextFor(staged))
    for (const key of Object.keys(staged) as (keyof Writes)[]) {
      ;(this.committed[key] as unknown[]).push(...staged[key])
    }
    return result
  }

  private contextFor(staged: Writes): UnitOfWorkContext {
    return {
      trees: {
        insert: async (tree) => void staged.insertedTrees.push(tree),
        update: async (tree) => void staged.updatedTrees.push(tree),
      },
      members: {
        insert: async (treeId, member) => void staged.insertedMembers.push({ treeId, member }),
        update: async (member) => void staged.updatedMembers.push(member),
        delete: async (memberId) => void staged.deletedMemberIds.push(memberId.value),
      },
      auditLog: { record: async (entry) => this.stageRecord(staged, entry) },
    }
  }

  private stageRecord(staged: Writes, entry: AuditRecord): void {
    if (this.auditFailure) {
      this.auditFailure = false
      throw new Error('Simulated audit log failure')
    }
    staged.auditRecords.push(entry)
  }
}
