import Link from 'next/link'
import { ButtonLink } from '@/presentation/components/ui/button-link'
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

function EmptyTreeList() {
  return (
    <div className="space-y-4 rounded-lg border border-earth-sand bg-white p-8 text-center">
      <p className="text-lg">Aucun arbre généalogique pour l’instant.</p>
      <ButtonLink href="/trees/new">Créer un arbre</ButtonLink>
    </div>
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
