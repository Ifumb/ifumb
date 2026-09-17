import type { SuggestionView } from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import { SUGGESTION_CONFIDENCE_LABELS } from '@/presentation/labels/cross-tree-labels'

const DELETED_MEMBER_LABEL = 'Membre supprimé'

export type SuggestionItemViewModel = {
  readonly id: string
  readonly memberName: string
  readonly targetTreeName: string
  readonly targetMemberName: string
  readonly confidenceLabel: string
  readonly createdAtIso: string
}

export function toSuggestionItems(views: readonly SuggestionView[]): readonly SuggestionItemViewModel[] {
  return views.map(toItem)
}

function toItem(view: SuggestionView): SuggestionItemViewModel {
  return {
    id: view.suggestion.id,
    memberName: view.memberName ?? DELETED_MEMBER_LABEL,
    targetTreeName: view.targetTreeName,
    targetMemberName: view.targetMemberName ?? DELETED_MEMBER_LABEL,
    confidenceLabel: SUGGESTION_CONFIDENCE_LABELS[view.suggestion.confidence],
    createdAtIso: view.suggestion.createdAt.toISOString(),
  }
}
