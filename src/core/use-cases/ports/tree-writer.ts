import 'server-only'
import type { Tree } from '@/core/entities/tree'

/** Write side of trees. */
export interface TreeWriter {
  insert(tree: Tree): Promise<void>
  /** Stores the details and the update time of an existing tree. */
  update(tree: Tree): Promise<void>
  /**
   * Claims the right to send one pending-change alert email for this tree, at most once an hour.
   * reason: a conditional write (`pendingNotifLastSentAt` unset or older than an hour) so that two
   * proposals made at nearly the same time cannot both pass the check and both send an email.
   */
  claimPendingAlertSlot(treeId: string, now: Date): Promise<boolean>
}
