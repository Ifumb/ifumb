import { notFound } from 'next/navigation'
import type { MemberWriteError } from '@/core/use-cases/member-write-access'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

const REFUSALS = {
  MEMBER_EDIT_FORBIDDEN: {
    title: 'Modification réservée',
    message:
      'Seuls le propriétaire de l’arbre et la personne qui s’est reconnue dans cette fiche peuvent la modifier.',
  },
  MEMBER_MANAGEMENT_FORBIDDEN: {
    title: 'Réservé au propriétaire',
    message: 'Seul le propriétaire de l’arbre peut supprimer un membre.',
  },
} as const

type MemberWriteRefusalProps = Readonly<{ treeId: string; error: MemberWriteError }>

/** What a page writing a member shows when the viewer may not use it. */
export function MemberWriteRefusal({ treeId, error }: MemberWriteRefusalProps) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
    case 'MEMBER_NOT_FOUND':
      notFound()
    case 'MEMBER_EDIT_FORBIDDEN':
    case 'MEMBER_MANAGEMENT_FORBIDDEN':
      return <RestrictedTreeView {...REFUSALS[error.kind]} treeHref={`/tree/${treeId}`} signedIn />
    default:
      return <PrivateTreeView signedIn />
  }
}
