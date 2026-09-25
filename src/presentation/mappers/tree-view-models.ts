import { canContribute, canManage } from '@/core/entities/tree'
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
  /** The tree's settings, for its owner only. */
  readonly settingsHref: `/tree/${string}/settings` | null
  /** Owners add directly; editors submit a proposal through the same guarded form. */
  readonly newMemberHref: `/tree/${string}/members/new` | null
  /** The union form is available to contributors; the server decides direct write or proposal. */
  readonly newUnionHref: `/tree/${string}/unions/new` | null
  /** Cross-tree suggestions (module 3.2), for its owner and editors only. */
  readonly suggestionsHref: `/tree/${string}/suggestions` | null
  /** Pending connection requests (module 3.2), for its owner only. */
  readonly connectionRequestsHref: `/tree/${string}/connection-requests` | null
  /** Established cross-tree links (module 3.2), open to anyone who can already read this tree. */
  readonly linksHref: `/tree/${string}/links`
}

// reason: le mapping centralise les libellés et liens selon le rôle sans décision métier dans la vue.
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
    settingsHref: canManage(summary.role) ? `/tree/${summary.id}/settings` : null,
    newMemberHref: canContribute(summary.role) ? `/tree/${summary.id}/members/new` : null,
    newUnionHref: canContribute(summary.role) ? `/tree/${summary.id}/unions/new` : null,
    suggestionsHref: canContribute(summary.role) ? `/tree/${summary.id}/suggestions` : null,
    connectionRequestsHref: canManage(summary.role)
      ? `/tree/${summary.id}/connection-requests`
      : null,
    linksHref: `/tree/${summary.id}/links`,
  }
}
