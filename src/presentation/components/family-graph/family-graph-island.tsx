'use client'

import dynamic from 'next/dynamic'
import type { FamilyGraphViewModel } from '@/presentation/graph/family-graph-types'
import { GRAPH_CANVAS_HEIGHT } from '@/presentation/graph/graph-dimensions'

/**
 * reason: `ssr: false` — React Flow measures the DOM to place nodes and edges, so it only renders
 * in the browser. `next/dynamic` also keeps the library out of every other route's bundle.
 */
const FamilyGraph = dynamic(
  () =>
    import('@/presentation/components/family-graph/family-graph').then((mod) => mod.FamilyGraph),
  { ssr: false, loading: GraphSkeleton },
)

const SKELETON_CLASS_NAMES = [
  'flex items-center justify-center',
  'rounded-lg border border-earth-sand bg-white motion-safe:animate-pulse',
]

export function FamilyGraphIsland({ graph }: Readonly<{ graph: FamilyGraphViewModel }>) {
  return <FamilyGraph graph={graph} />
}

function GraphSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      style={{ height: GRAPH_CANVAS_HEIGHT }}
      className={SKELETON_CLASS_NAMES.join(' ')}
    >
      <p>Chargement du graphe…</p>
    </div>
  )
}
