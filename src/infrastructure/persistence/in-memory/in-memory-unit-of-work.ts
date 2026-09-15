import 'server-only'
import type { Member } from '@/core/entities/member'
import type { Tree } from '@/core/entities/tree'
import type { Filiation, Union } from '@/core/entities/union'
import type { AuditRecord } from '@/core/use-cases/ports/audit-log-writer'
import type { UnitOfWork, UnitOfWorkContext } from '@/core/use-cases/ports/unit-of-work'

type InsertedMember = { readonly treeId: string; readonly member: Member }
type InsertedUnion = { readonly treeId: string; readonly union: Union }
type AddedUnionChild = {
  readonly unionId: string
  readonly linkId: string
  readonly childId: string
  readonly filiation: Filiation
}
type UpdatedPhoto = { readonly memberId: string; readonly photoUrl: string | null }
type RemovedUnionChild = { readonly unionId: string; readonly childId: string }

type Writes = {
  insertedTrees: Tree[]
  updatedTrees: Tree[]
  insertedMembers: InsertedMember[]
  updatedMembers: Member[]
  deletedMemberIds: string[]
  updatedPhotos: UpdatedPhoto[]
  insertedUnions: InsertedUnion[]
  updatedUnions: Union[]
  deletedUnionIds: string[]
  addedUnionChildren: AddedUnionChild[]
  removedUnionChildren: RemovedUnionChild[]
  auditRecords: AuditRecord[]
}

const noWrites = (): Writes => ({
  insertedTrees: [],
  updatedTrees: [],
  insertedMembers: [],
  updatedMembers: [],
  deletedMemberIds: [],
  updatedPhotos: [],
  insertedUnions: [],
  updatedUnions: [],
  deletedUnionIds: [],
  addedUnionChildren: [],
  removedUnionChildren: [],
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
  get updatedPhotos() {
    return this.committed.updatedPhotos
  }
  get insertedUnions() {
    return this.committed.insertedUnions
  }
  get updatedUnions() {
    return this.committed.updatedUnions
  }
  get deletedUnionIds() {
    return this.committed.deletedUnionIds
  }
  get addedUnionChildren() {
    return this.committed.addedUnionChildren
  }
  get removedUnionChildren() {
    return this.committed.removedUnionChildren
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
        updatePhoto: async (memberId, photoUrl) =>
          void staged.updatedPhotos.push({ memberId: memberId.value, photoUrl }),
      },
      unions: unionWriterFor(staged),
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

function unionWriterFor(staged: Writes): UnitOfWorkContext['unions'] {
  return {
    insert: async (treeId, union) => void staged.insertedUnions.push({ treeId, union }),
    update: async (union) => void staged.updatedUnions.push(union),
    delete: async (unionId) => void staged.deletedUnionIds.push(unionId),
    addChild: async (unionId, { id, childId, filiation }) =>
      void staged.addedUnionChildren.push({
        unionId,
        linkId: id,
        childId: childId.value,
        filiation,
      }),
    removeChild: async (unionId, childId) =>
      void staged.removedUnionChildren.push({ unionId, childId: childId.value }),
  }
}
