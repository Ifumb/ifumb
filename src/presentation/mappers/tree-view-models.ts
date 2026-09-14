import { canContribute } from '@/core/entities/tree'
import type { TreeSummary } from '@/core/use-cases/tree-summary'
import { memberCountLabel, ROLE_LABELS, VISIBILITY_LABELS } from '@/presentation/labels/tree-labels'

/** Display-ready tree: views receive only this, never a use-case type. */
export type TreeViewModel = {
  readonly id: string
  readonly href: `/tree/${string}`
  readonly name: string
  readonly description: string | null
  readonly ownerName: string
  readonly memberCountLabel: string
  readonly visibilityLabel: string
  readonly roleLabel: string
  /** The tree's history, for its contributors only. */
  readonly historyHref: `/tree/${string}/history` | null
}

export function toTreeViewModel(summary: TreeSummary): TreeViewModel {
  return {
    id: summary.id,
    href: `/tree/${summary.id}`,
    name: summary.name,
    description: summary.description,
    ownerName: `${summary.ownerName.firstName} ${summary.ownerName.lastName}`,
    memberCountLabel: memberCountLabel(summary.memberCount),
    visibilityLabel: VISIBILITY_LABELS[summary.visibility],
    roleLabel: ROLE_LABELS[summary.role],
    historyHref: canContribute(summary.role) ? `/tree/${summary.id}/history` : null,
  }
}
