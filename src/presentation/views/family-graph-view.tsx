import Link from 'next/link'
import { FamilyGraphIsland } from '@/presentation/components/family-graph/family-graph-island'
import type { FamilyGraphViewModel } from '@/presentation/graph/family-graph-types'

type FamilyGraphViewProps = Readonly<{ graph: FamilyGraphViewModel }>

export function FamilyGraphView({ graph }: FamilyGraphViewProps) {
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
        <GraphBody graph={graph} />
      )}
    </section>
  )
}

function GraphBody({ graph }: FamilyGraphViewProps) {
  return (
    <>
      <p className="max-w-prose">
        Chaque membre du graphe est un lien vers sa fiche. La{' '}
        <Link href={`${graph.treeHref}#members`}>liste des membres</Link> présente les mêmes
        personnes sous forme de texte.
      </p>
      <FamilyGraphIsland graph={graph} />
    </>
  )
}
