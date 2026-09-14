import Link from 'next/link'
import type { TreeViewModel } from '@/presentation/mappers/tree-view-models'
import { LinkList, type LinkItem } from '@/presentation/views/link-list'
import { TreeFacts } from '@/presentation/views/tree-facts'

type TreeOverviewViewProps = Readonly<{
  tree: TreeViewModel
  /** Where "back" leads: the dashboard when signed in, the home page otherwise. */
  backLink: LinkItem
}>

export function TreeOverviewView({ tree, backLink }: TreeOverviewViewProps) {
  return (
    <section aria-labelledby="tree-title" className="space-y-6">
      <LinkList links={[backLink]} />
      <h1 id="tree-title" className="text-3xl font-bold">
        {tree.name}
      </h1>
      {tree.description && <p className="max-w-prose text-lg">{tree.description}</p>}
      <TreeFacts tree={tree} />
      <TreeLinks tree={tree} />
    </section>
  )
}

/** The tree's other pages; editing and history only appear for those allowed to use them. */
function TreeLinks({ tree }: Readonly<{ tree: TreeViewModel }>) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      <li>
        <Link href={`${tree.href}/graph`}>Voir le graphe</Link>
      </li>
      {tree.settingsHref && (
        <li>
          <Link href={tree.settingsHref}>Modifier l’arbre</Link>
        </li>
      )}
      {tree.historyHref && (
        <li>
          <Link href={tree.historyHref}>Journal de l’arbre</Link>
        </li>
      )}
    </ul>
  )
}
