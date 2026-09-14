import Link from 'next/link'
import type { ReactNode } from 'react'
import { FamilyGraphIsland } from '@/presentation/components/family-graph/family-graph-island'
import type { FamilyGraphViewModel } from '@/presentation/graph/family-graph-types'

type FamilyGraphViewProps = Readonly<{
  graph: FamilyGraphViewModel
  /** The descendance, kinship and common ancestors tools. */
  tools?: ReactNode
  /** The outcome of the active tool, shown above the graph. */
  result?: ReactNode
}>

export function FamilyGraphView({ graph, tools, result }: FamilyGraphViewProps) {
  return (
    <section aria-labelledby="graph-title" className="space-y-4">
      <p>
        <Link href={graph.treeHref}>Retour à {graph.treeName}</Link>
      </p>
      <h1 id="graph-title" className="text-3xl font-bold">
        Graphe — {graph.treeName}
      </h1>
      {graph.memberCount === 0 ? (
        <p>Cet arbre ne contient encore aucun membre.</p>
      ) : (
        <GraphBody graph={graph} tools={tools} result={result} />
      )}
    </section>
  )
}

function GraphBody({ graph, tools, result }: FamilyGraphViewProps) {
  return (
    <>
      <p className="max-w-prose">
        Chaque membre du graphe est un lien vers sa fiche. La{' '}
        <Link href={`${graph.treeHref}#members`}>liste des membres</Link> présente les mêmes
        personnes sous forme de texte.
      </p>
      {tools}
      {result}
      <FamilyGraphIsland graph={graph} />
    </>
  )
}
