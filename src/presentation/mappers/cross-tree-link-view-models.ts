import type { CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'

const DELETED_MEMBER_LABEL = 'Membre supprimé'

export type CrossTreeLinkItemViewModel = {
  readonly id: string
  readonly linkedTreeName: string
  readonly linkedTreeHref: `/tree/${string}` | null
  readonly linkedMemberName: string
  readonly ownMemberName: string
  readonly createdAtIso: string
}

export function toCrossTreeLinkItems(
  treeId: string,
  views: readonly CrossTreeLinkView[],
): readonly CrossTreeLinkItemViewModel[] {
  return views.map((view) => toItem(treeId, view))
}

function toItem(treeId: string, view: CrossTreeLinkView): CrossTreeLinkItemViewModel {
  const other = view.link.otherSide(treeId)
  return {
    id: view.link.id,
    linkedTreeName: view.linkedTreeName,
    linkedTreeHref: other ? `/tree/${other.treeId}` : null,
    linkedMemberName: view.linkedMemberName ?? DELETED_MEMBER_LABEL,
    ownMemberName: view.ownMemberName ?? DELETED_MEMBER_LABEL,
    createdAtIso: view.link.createdAt.toISOString(),
  }
}
