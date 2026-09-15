import { notFound } from 'next/navigation'
import type { UnionWriteError } from '@/core/use-cases/union-write-access'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type UnionWriteRefusalProps = Readonly<{ treeId: string; error: UnionWriteError }>

/** What a page writing a union shows when the viewer may not use it. */
export function UnionWriteRefusal({ treeId, error }: UnionWriteRefusalProps) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
    case 'UNION_NOT_FOUND':
      notFound()
    case 'UNION_MANAGEMENT_FORBIDDEN':
      return (
        <RestrictedTreeView
          title="Réservé au propriétaire"
          treeHref={`/tree/${treeId}`}
          signedIn
          message="Seul le propriétaire de l’arbre peut créer, modifier ou supprimer ses unions."
        />
      )
    default:
      return <PrivateTreeView signedIn />
  }
}
