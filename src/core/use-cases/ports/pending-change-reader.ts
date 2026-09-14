import 'server-only'
import type { TreeId } from '@/core/shared/value-objects/tree-id'

export type PendingAction = 'CREATE' | 'UPDATE' | 'DELETE'

/** Read side of the changes editors proposed and the owner has not reviewed yet. */
export interface PendingChangeReader {
  /** The pending action per target (member or union id); the latest one when there are several. */
  pendingTargets(treeId: TreeId): Promise<ReadonlyMap<string, PendingAction>>
}
