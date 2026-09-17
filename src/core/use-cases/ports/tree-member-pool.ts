import 'server-only'
import type { MatchableMember } from '@/core/entities/member-matching'

/**
 * Read side of the candidate pool `ComputeSuggestionsUseCase` matches a tree's members against:
 * every member of a `PUBLIC` or `SHARED`, non-archived tree, plus every member of a tree
 * `computedByUserId` personally has access to (owner or accepted invitation) — never the source
 * tree itself. Reduced to `MatchableMember`, never a whole `Member` or `Family`: the matching
 * algorithm only ever looks at a few fields, across what can be many trees.
 */
export interface TreeMemberPool {
  candidatesFor(sourceTreeId: string, computedByUserId: string): Promise<readonly MatchableMember[]>
}
