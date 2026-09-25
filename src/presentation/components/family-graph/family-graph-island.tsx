'use client'

import dynamic from 'next/dynamic'
import type { FamilyGraphPresentationProps } from '@/presentation/components/family-graph/graph-presentation-props'

// reason: React Flow mesure le DOM ; l’îlot dynamique garde son code hors des autres pages.
const FamilyGraph = dynamic(
  () =>
    import('@/presentation/components/family-graph/family-graph').then((mod) => mod.FamilyGraph),
  { ssr: false, loading: GraphSkeleton },
)

export function FamilyGraphIsland(props: FamilyGraphPresentationProps) {
  return <FamilyGraph {...props} />
}

function GraphSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex h-full items-center justify-center motion-safe:animate-pulse"
    >
      Chargement du graphe…
    </div>
  )
}
