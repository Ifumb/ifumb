import 'server-only'
import type { Member } from '@/core/entities/member'
import type { PendingChange } from '@/core/entities/pending-change'
import type { Tree } from '@/core/entities/tree'
import type { Filiation, Union } from '@/core/entities/union'
import type { AuditRecord } from '@/core/use-cases/ports/audit-log-writer'
import type { NotificationRecord } from '@/core/use-cases/ports/notification-writer'
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
  proposedChanges: PendingChange[]
  resolvedChanges: PendingChange[]
  notifications: NotificationRecord[]
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
  proposedChanges: [],
  resolvedChanges: [],
  notifications: [],
})

/**
 * Test double of the unit of work: writes are staged during the work and kept only when it
 * succeeds, which is what a real transaction guarantees.
 */
const PENDING_ALERT_WINDOW_MS = 60 * 60 * 1000

export class InMemoryUnitOfWork implements UnitOfWork, Readonly<Writes> {
  private readonly committed = noWrites()
  private readonly pendingAlertSlots = new Map<string, Date>()
  transactions = 0
  private auditFailure = false
  private notificationFailure = false

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
  get proposedChanges() {
    return this.committed.proposedChanges
  }
  get resolvedChanges() {
    return this.committed.resolvedChanges
  }
  get notifications() {
    return this.committed.notifications
  }

  /** Makes the next audit entry fail, as a database error inside the transaction would. */
  failNextAuditRecord(): void {
    this.auditFailure = true
  }

  /** Makes the next notification fail, as a database error inside the transaction would. */
  failNextNotification(): void {
    this.notificationFailure = true
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
        claimPendingAlertSlot: async (treeId, now) => this.claimAlertSlot(treeId, now),
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
      pendingChanges: {
        propose: async (change) => void staged.proposedChanges.push(change),
        resolve: async (change) => void staged.resolvedChanges.push(change),
      },
      notifications: { record: async (entry) => this.stageNotification(staged, entry) },
    }
  }

  private stageRecord(staged: Writes, entry: AuditRecord): void {
    if (this.auditFailure) {
      this.auditFailure = false
      throw new Error('Simulated audit log failure')
    }
    staged.auditRecords.push(entry)
  }

  private stageNotification(staged: Writes, entry: NotificationRecord): void {
    if (this.notificationFailure) {
      this.notificationFailure = false
      throw new Error('Simulated notification failure')
    }
    staged.notifications.push(entry)
  }

  /** Not staged with the rest: a real conditional UPDATE commits outside any rollback the caller sees. */
  private claimAlertSlot(treeId: string, now: Date): boolean {
    const last = this.pendingAlertSlots.get(treeId)
    if (last && now.getTime() - last.getTime() < PENDING_ALERT_WINDOW_MS) return false
    this.pendingAlertSlots.set(treeId, now)
    return true
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
