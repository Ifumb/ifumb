import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GraphViewContent } from '@/app/tree/[id]/graph/graph-view-content'
import { loadFamilyGraph } from '@/app/tree/[id]/graph/load-family-graph'
import { loadGraphView } from '@/app/tree/[id]/graph/load-graph-view'
import { parseGraphView } from '@/presentation/schemas/graph-view-schema'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'

type GraphPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

// reason: SAME_MEMBER cannot come from the URL parser, which already rejects two identical members;
// were it reached anyway, the request names nothing that exists, like a missing member.
const NOT_FOUND_KINDS = new Set(['TREE_NOT_FOUND', 'MEMBER_NOT_FOUND', 'SAME_MEMBER'])

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

export default async function GraphPage({ params, searchParams }: GraphPageProps) {
  const { id } = await params
  const request = parseGraphView(await searchParams)
  const { signedIn, graph, mode, crossTreeLinks } = await loadGraphView(id, request)

  if (!graph.ok) return unreadableGraph(graph.error.kind, signedIn)
  if (mode.kind !== 'none' && !mode.result.ok)
    return unreadableGraph(mode.result.error.kind, signedIn)
  return (
    <GraphViewContent
      treeId={id}
      request={request}
      graph={graph.value}
      mode={mode}
      crossTreeLinks={crossTreeLinks}
    />
  )
}

function unreadableGraph(kind: string, signedIn: boolean) {
  if (NOT_FOUND_KINDS.has(kind)) notFound()
  return <PrivateTreeView signedIn={signedIn} />
}
