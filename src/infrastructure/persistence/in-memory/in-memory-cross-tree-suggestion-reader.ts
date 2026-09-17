import 'server-only'
import type { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import type {
  CrossTreeSuggestionReader,
  SuggestionView,
} from '@/core/use-cases/ports/cross-tree-suggestion-reader'

/** Test double of the cross-tree suggestion reader. */
export class InMemoryCrossTreeSuggestionReader implements CrossTreeSuggestionReader {
  private readonly byId = new Map<string, CrossTreeSuggestion>()
  private readonly views = new Map<string, SuggestionView>()

  seed(suggestion: CrossTreeSuggestion): void {
    this.byId.set(suggestion.id, suggestion)
  }

  /** Seeds what `listNewForTree` shows for this suggestion; `seed` it too, separately. */
  seedView(view: SuggestionView): void {
    this.views.set(view.suggestion.id, view)
  }

  async listNewForTree(treeId: string): Promise<readonly SuggestionView[]> {
    return [...this.views.values()].filter(
      (view) => view.suggestion.treeId === treeId && view.suggestion.isNew,
    )
  }

  async findById(id: string): Promise<CrossTreeSuggestion | null> {
    return this.byId.get(id) ?? null
  }

  async listAcceptedPairsForTree(treeId: string): Promise<ReadonlySet<string>> {
    const pairs = [...this.byId.values()]
      .filter((suggestion) => suggestion.treeId === treeId && suggestion.status === 'ACCEPTED')
      .map((suggestion) => `${suggestion.memberId}:${suggestion.targetMemberId}`)
    return new Set(pairs)
  }
}
