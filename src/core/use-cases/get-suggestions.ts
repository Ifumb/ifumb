import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { CrossTreeSuggestionReader, SuggestionView } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { readableTree } from '@/core/use-cases/tree-read-access'
import { contributableTree, type TreeContributionError } from '@/core/use-cases/tree-contribution-access'

export type GetSuggestionsInput = { readonly treeId: string; readonly viewerId: string }

type GetSuggestionsDeps = {
  readonly trees: TreeReader
  readonly suggestions: CrossTreeSuggestionReader
}

/**
 * `NEW` suggestions of a tree, for its owner or editors — but only the ones whose target tree the
 * *current viewer* can themselves read (module 3.2, decision 1). The legacy app served every
 * suggestion to every owner/editor of the source tree, regardless of whether that particular viewer
 * had any access to the private target tree a suggestion pointed at — a real authorization gap this
 * closes by filtering at read time, not by shrinking what `ComputeSuggestionsUseCase` may match.
 */
export class GetSuggestionsUseCase {
  constructor(private readonly deps: GetSuggestionsDeps) {}

  async execute(
    input: GetSuggestionsInput,
  ): Promise<Result<readonly SuggestionView[], TreeContributionError>> {
    const access = await contributableTree(this.deps.trees, input)
    if (!access.ok) return access

    const all = await this.deps.suggestions.listNewForTree(input.treeId)
    const targetTreeIds = [...new Set(all.map((view) => view.suggestion.targetTreeId))]
    const accessible = new Set<string>()
    for (const targetTreeId of targetTreeIds) {
      const targetAccess = await readableTree(this.deps.trees, {
        treeId: targetTreeId,
        viewerId: input.viewerId,
      })
      if (targetAccess.ok) accessible.add(targetTreeId)
    }
    return ok(all.filter((view) => accessible.has(view.suggestion.targetTreeId)))
  }
}
