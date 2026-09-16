import 'server-only'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type {
  PendingAction,
  PendingChangeReader,
  PendingChangeSummary,
} from '@/core/use-cases/ports/pending-change-reader'

/** Test double of the pending change reader; counts reads so tests can prove none happened. */
export class InMemoryPendingChangeReader implements PendingChangeReader {
  private readonly targetsByTree = new Map<string, ReadonlyMap<string, PendingAction>>()
  private readonly changesByTree = new Map<string, PendingChangeSummary[]>()
  private reads = 0

  seed(treeId: string, targets: Readonly<Record<string, PendingAction>>): void {
    this.targetsByTree.set(treeId, new Map(Object.entries(targets)))
  }

  /** Seeds one change summary, newest first among those already seeded for the tree. */
  seedChange(treeId: string, change: PendingChangeSummary): void {
    const existing = this.changesByTree.get(treeId) ?? []
    this.changesByTree.set(treeId, [change, ...existing])
  }

  get readCount(): number {
    return this.reads
  }

  async pendingTargets(treeId: TreeId): Promise<ReadonlyMap<string, PendingAction>> {
    this.reads += 1
    return this.targetsByTree.get(treeId.value) ?? new Map()
  }

  async pendingForTree(treeId: TreeId): Promise<readonly PendingChangeSummary[]> {
    return (this.changesByTree.get(treeId.value) ?? []).filter(
      (change) => change.status === 'PENDING',
    )
  }

  async byAuthor(treeId: TreeId, authorId: string): Promise<readonly PendingChangeSummary[]> {
    return (this.changesByTree.get(treeId.value) ?? []).filter(
      (change) => change.authorId === authorId,
    )
  }
}
