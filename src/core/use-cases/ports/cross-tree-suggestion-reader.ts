import 'server-only'
import type { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'

/**
 * A suggestion as a reader sees it: named on both sides. `memberId`/`targetMemberId` are not real
 * Prisma relations (module 3.2, legacy bug 7 — deleting a member never cleans these up), so either
 * name can be missing; the reader tolerates that rather than failing the whole list.
 */
export type SuggestionView = {
  readonly suggestion: CrossTreeSuggestion
  readonly memberName: string | null
  readonly targetTreeName: string
  readonly targetMemberName: string | null
}

/** Read side of cross-tree suggestions. */
export interface CrossTreeSuggestionReader {
  listNewForTree(treeId: string): Promise<readonly SuggestionView[]>
  findById(id: string): Promise<CrossTreeSuggestion | null>
  /**
   * `(memberId, targetMemberId)` pairs of this tree's `ACCEPTED` suggestions, as `"memberId:
   * targetMemberId"` keys — for `ComputeSuggestionsUseCase` to skip when recomputing (module 3.2,
   * decision 2): an accepted suggestion is already a live connection request, never silently reset.
   */
  listAcceptedPairsForTree(treeId: string): Promise<ReadonlySet<string>>
}
