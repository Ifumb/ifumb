import 'server-only'
import type { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'

/**
 * Write side of cross-tree suggestions.
 * reason: `(memberId, targetMemberId)` is unique in the database — `upsertMany` is a plain upsert
 * on that pair, create-or-update, no conditional logic. Skipping pairs already `ACCEPTED` is the
 * caller's responsibility (`ComputeSuggestionsUseCase`, via `CrossTreeSuggestionReader
 * .listAcceptedPairsForTree`), not this writer's — matching the project's established pattern of
 * deciding in the use case and keeping writers dumb.
 */
export interface CrossTreeSuggestionWriter {
  upsertMany(suggestions: readonly CrossTreeSuggestion[]): Promise<void>
  resolve(suggestion: CrossTreeSuggestion): Promise<void>
}
