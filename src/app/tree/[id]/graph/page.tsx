import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadFamilyGraph } from '@/app/tree/[id]/graph/load-family-graph'
import { configuredMemberPhotoSource } from '@/infrastructure/config/member-photos'
import { toFamilyGraphViewModel } from '@/presentation/graph/layout-family-graph'
import { FamilyGraphView } from '@/presentation/views/family-graph-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'

type GraphPageProps = Readonly<{ params: Promise<{ id: string }> }>

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

export default async function GraphPage({ params }: GraphPageProps) {
  const { signedIn, result } = await loadFamilyGraph((await params).id)
  if (!result.ok) {
    if (result.error.kind === 'TREE_NOT_FOUND') notFound()
    return <PrivateTreeView signedIn={signedIn} />
  }
  const graph = toFamilyGraphViewModel(result.value, configuredMemberPhotoSource())
  return <FamilyGraphView graph={graph} />
}
