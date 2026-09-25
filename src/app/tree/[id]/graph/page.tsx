import type { Metadata } from 'next'
import { loadFamilyGraph } from '@/app/tree/[id]/graph/load-family-graph'
import { TreeWorkspacePage, type TreeWorkspacePageProps } from '@/app/tree/[id]/tree-workspace-page'

type GraphPageProps = TreeWorkspacePageProps

export async function generateMetadata({ params }: GraphPageProps): Promise<Metadata> {
  const { result } = await loadFamilyGraph((await params).id)
  if (!result.ok) {
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  const { name } = result.value.tree
  return {
    title: `Graphe — ${name}`,
    description: `Graphe généalogique interactif de l’arbre ${name}.`,
    // An interactive view of the tree page's content: the tree page is the one to index.
    robots: { index: false },
  }
}

export default TreeWorkspacePage
