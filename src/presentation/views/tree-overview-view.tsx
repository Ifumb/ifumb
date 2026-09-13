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
    </section>
  )
}
