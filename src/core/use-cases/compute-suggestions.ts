import 'server-only'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import { matchConfidence, toMatchableMember } from '@/core/entities/member-matching'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { CrossTreeSuggestionReader } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeMemberPool } from '@/core/use-cases/ports/tree-member-pool'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { contributableTree, type TreeContributionError } from '@/core/use-cases/tree-contribution-access'

export type ComputeSuggestionsInput = { readonly treeId: string; readonly viewerId: string }
export type ComputeSuggestionsResult = { readonly computed: number }

type ComputeSuggestionsDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly pool: TreeMemberPool
  readonly suggestions: CrossTreeSuggestionReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * Matches every member of this tree against a candidate pool (public/shared trees, plus whatever
 * the viewer personally has access to — never the source tree itself), and stores the result.
 * Pairs already `ACCEPTED` (module 3.2, decision 2: an accepted suggestion is already a live
 * connection request) are filtered out here, before the write — the writer itself is a dumb
 * upsert and never inspects existing status, matching the project's established pattern
 * (`SendInvitationUseCase`, `SendContactRequestUseCase`: the use case reads and decides, the
 * writer just persists).
 */
export class ComputeSuggestionsUseCase {
  constructor(private readonly deps: ComputeSuggestionsDeps) {}

  async execute(
    input: ComputeSuggestionsInput,
  ): Promise<Result<ComputeSuggestionsResult, TreeContributionError>> {
    const access = await contributableTree(this.deps.trees, input)
    if (!access.ok) return access

    const family = await this.deps.families.loadFamily(access.value.listing.tree.id)
    const sourceMembers = family.members().map((member) => toMatchableMember(input.treeId, member))
    const candidates = await this.deps.pool.candidatesFor(input.treeId, input.viewerId)

    const now = this.deps.clock.now()
    const suggestions: CrossTreeSuggestion[] = []
    for (const source of sourceMembers) {
      for (const candidate of candidates) {
        const confidence = matchConfidence(source, candidate)
        if (!confidence) continue
        suggestions.push(
          CrossTreeSuggestion.propose({
            id: this.deps.ids.next(),
            treeId: source.treeId,
            memberId: source.memberId,
            targetTreeId: candidate.treeId,
            targetMemberId: candidate.memberId,
            confidence,
            now,
          }),
        )
      }
    }

    const acceptedPairs = await this.deps.suggestions.listAcceptedPairsForTree(input.treeId)
    const toWrite = suggestions.filter(
      (suggestion) => !acceptedPairs.has(`${suggestion.memberId}:${suggestion.targetMemberId}`),
    )

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.crossTreeSuggestions.upsertMany(toWrite)
    })
    return ok({ computed: toWrite.length })
  }
}
