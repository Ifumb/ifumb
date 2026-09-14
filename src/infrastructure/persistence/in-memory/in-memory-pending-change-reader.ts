import 'server-only'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type {
  PendingAction,
  PendingChangeReader,
} from '@/core/use-cases/ports/pending-change-reader'

/** Test double of the pending change reader; counts reads so tests can prove none happened. */
export class InMemoryPendingChangeReader implements PendingChangeReader {
  private readonly targetsByTree = new Map<string, ReadonlyMap<string, PendingAction>>()
  private reads = 0

  seed(treeId: string, targets: Readonly<Record<string, PendingAction>>): void {
    this.targetsByTree.set(treeId, new Map(Object.entries(targets)))
  }

  get readCount(): number {
    return this.reads
  }

  async pendingTargets(treeId: TreeId): Promise<ReadonlyMap<string, PendingAction>> {
    this.reads += 1
    return this.targetsByTree.get(treeId.value) ?? new Map()
  }
}
