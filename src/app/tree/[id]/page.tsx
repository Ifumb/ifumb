import type { Metadata } from 'next'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import { TreeWorkspacePage, type TreeWorkspacePageProps } from '@/app/tree/[id]/tree-workspace-page'

type TreePageProps = TreeWorkspacePageProps

const DEFAULT_DESCRIPTION = 'Un arbre généalogique partagé sur IFUMB.'

export async function generateMetadata({ params }: TreePageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    // A tree the visitor may not read never gives its name away, not even in the tab title.
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  const tree = result.value
  return {
    title: tree.name,
    description: tree.description ?? DEFAULT_DESCRIPTION,
    robots: { index: tree.visibility === 'PUBLIC' },
  }
}

export default TreeWorkspacePage
