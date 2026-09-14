import type { TreeViewModel } from '@/presentation/mappers/tree-view-models'
import { FactList } from '@/presentation/views/fact-list'

/** Owner, size, visibility and the reader's role of a tree. */
export function TreeFacts({ tree }: Readonly<{ tree: TreeViewModel }>) {
  return (
    <FactList
      facts={[
        { term: 'Propriétaire', detail: tree.ownerName },
        { term: 'Membres', detail: tree.memberCountLabel },
        { term: 'Visibilité', detail: tree.visibilityLabel },
        { term: 'Votre rôle', detail: tree.roleLabel },
      ]}
    />
  )
}
