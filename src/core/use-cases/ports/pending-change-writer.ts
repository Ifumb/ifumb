import 'server-only'
import type { PendingChange } from '@/core/entities/pending-change'

/**
 * Write side of proposals editors make.
 * reason: an editor may hold only one PENDING proposal per target (decision confirmed with the
 * user, module 2.6): a second proposal from the same author on the same target replaces their own
 * earlier one; a different author's proposal on that target is stored alongside it, not over it.
 */
export interface PendingChangeWriter {
  propose(change: PendingChange): Promise<void>
  /** Stores a proposal's resolution: its status, its comment, who resolved it, and when. */
  resolve(change: PendingChange): Promise<void>
  /**
   * Rejects every PENDING proposal a revoked collaborator still has on this tree, so nothing of
   * theirs is left waiting for a review they can no longer receive (module 2.8).
   */
  rejectAllByAuthor(treeId: string, authorId: string, now: Date): Promise<void>
}
