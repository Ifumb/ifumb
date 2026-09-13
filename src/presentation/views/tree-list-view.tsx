import Link from 'next/link'
import type { TreeViewModel } from '@/presentation/mappers/tree-view-models'
import { TreeFacts } from '@/presentation/views/tree-facts'

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

// reason: the design system asks for an action in an empty state; creating a tree is ported with
// the tree mutations (Phase 1), so this empty state has only its message until then.
function EmptyTreeList() {
  return (
    <p className="rounded-lg border border-earth-sand bg-white p-8 text-center text-lg">
      Aucun arbre généalogique pour l’instant.
    </p>
  )
}

function TreeCard({ tree }: Readonly<{ tree: TreeViewModel }>) {
  return (
    <article className="h-full space-y-3 rounded-lg border border-earth-sand bg-white p-5">
      <h2 className="text-lg font-semibold">
        <Link href={tree.href}>{tree.name}</Link>
      </h2>
      {tree.description && <p className="text-sm">{tree.description}</p>}
      <TreeFacts tree={tree} />
    </article>
  )
}
