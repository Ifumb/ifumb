import Link from 'next/link'
import { Icon } from '@/presentation/components/ui/icon'
import type { TreeViewModel } from '@/presentation/mappers/tree-view-models'

type TreeListViewProps = Readonly<{ trees: readonly TreeViewModel[] }>

export function TreeListView({ trees }: TreeListViewProps) {
  if (trees.length === 0) return <EmptyTreeList />
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trees.map((tree) => (
        <li key={tree.id}>
          <TreeCard tree={tree} />
        </li>
      ))}
    </ul>
  )
}

function EmptyTreeList() {
  return (
    <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
      <p className="mb-4 text-lg text-gray-500">Aucun arbre généalogique pour l’instant.</p>
      <Link href="/trees/new" className="primary-action">
        Créer mon premier arbre
      </Link>
    </div>
  )
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function TreeCard({ tree }: Readonly<{ tree: TreeViewModel }>) {
  return (
    <article className="h-full">
      <Link href={tree.href} className="tree-card">
        <h2 className="text-lg font-semibold text-gray-800">{tree.name}</h2>
        {tree.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{tree.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>{tree.memberCountLabel}</span>
          <div className="flex items-center gap-1.5">
            {tree.roleLabel !== 'Propriétaire' && (
              <span className="role-badge">{tree.roleLabel}</span>
            )}
            <span className="visibility-badge">{tree.visibilityLabel}</span>
          </div>
        </div>
        <span className="sr-only">
          Propriétaire : {tree.ownerName}. Votre rôle : {tree.roleLabel}
        </span>
      </Link>
    </article>
  )
}

export function CreateTreeLink() {
  return (
    <Link
      href="/trees/new"
      id="tour-btn-create-tree"
      aria-label="Créer un arbre"
      className="primary-action shrink-0"
    >
      <Icon name="plus" />
      Créer
    </Link>
  )
}
