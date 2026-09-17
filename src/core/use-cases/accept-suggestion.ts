import 'server-only'
import type { SuggestionAlreadyResolved } from '@/core/entities/cross-tree-suggestion'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { CrossTreeSuggestionReader } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { contributableTree, type TreeContributionError } from '@/core/use-cases/tree-contribution-access'

/** How long the owner of the target tree has to approve or refuse, carried over from the legacy app. */
export const CONNECTION_REQUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type AcceptSuggestionInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly suggestionId: string
}

export type AcceptSuggestionError =
  | TreeContributionError
  | { readonly kind: 'SUGGESTION_NOT_FOUND' }
  | SuggestionAlreadyResolved

type AcceptSuggestionDeps = {
  readonly trees: TreeReader
  readonly suggestions: CrossTreeSuggestionReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** "This looks like the same person" — opens a connection request for the target tree's owner. */
export class AcceptSuggestionUseCase {
  constructor(private readonly deps: AcceptSuggestionDeps) {}

  async execute(input: AcceptSuggestionInput): Promise<Result<void, AcceptSuggestionError>> {
    const access = await contributableTree(this.deps.trees, input)
    if (!access.ok) return access

    const suggestion = await this.deps.suggestions.findById(input.suggestionId)
    if (!suggestion || suggestion.treeId !== input.treeId) {
      return err({ kind: 'SUGGESTION_NOT_FOUND' })
    }

    const now = this.deps.clock.now()
    const accepted = suggestion.accept(now)
    if (!accepted.ok) return accepted

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.crossTreeSuggestions.resolve(accepted.value)
      await context.connectionRequests.create(
        CrossTreeConnectionRequest.open({
          id: this.deps.ids.next(),
          requesterTreeId: suggestion.treeId,
          requesterMemberId: suggestion.memberId,
          targetTreeId: suggestion.targetTreeId,
          targetMemberId: suggestion.targetMemberId,
          initiatedByUserId: input.viewerId,
          expiresAt: new Date(now.getTime() + CONNECTION_REQUEST_TTL_MS),
          now,
        }),
      )
    })
    return ok(undefined)
  }
}
