import 'server-only'
import type { SuggestionAlreadyResolved } from '@/core/entities/cross-tree-suggestion'
import { err, ok, type Result } from '@/core/shared/result'
import type { CrossTreeSuggestionReader } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { contributableTree, type TreeContributionError } from '@/core/use-cases/tree-contribution-access'

export type RejectSuggestionInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly suggestionId: string
}

export type RejectSuggestionError =
  | TreeContributionError
  | { readonly kind: 'SUGGESTION_NOT_FOUND' }
  | SuggestionAlreadyResolved

type RejectSuggestionDeps = {
  readonly trees: TreeReader
  readonly suggestions: CrossTreeSuggestionReader
  readonly unitOfWork: UnitOfWork
  readonly clock: Clock
}

/** "Not the same person" — terminal for this computation; a later recompute may bring it back. */
export class RejectSuggestionUseCase {
  constructor(private readonly deps: RejectSuggestionDeps) {}

  async execute(input: RejectSuggestionInput): Promise<Result<void, RejectSuggestionError>> {
    const access = await contributableTree(this.deps.trees, input)
    if (!access.ok) return access

    const suggestion = await this.deps.suggestions.findById(input.suggestionId)
    if (!suggestion || suggestion.treeId !== input.treeId) {
      return err({ kind: 'SUGGESTION_NOT_FOUND' })
    }

    const rejected = suggestion.reject(this.deps.clock.now())
    if (!rejected.ok) return rejected

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.crossTreeSuggestions.resolve(rejected.value)
    })
    return ok(undefined)
  }
}
