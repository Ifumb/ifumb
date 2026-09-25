import { GuidedTour } from '@/presentation/components/navigation/guided-tour'
import type { FamilyGraphViewModel } from '@/presentation/graph/family-graph-types'

export function GraphGuidedTour({
  graph,
  canCreate,
}: Readonly<{
  graph: FamilyGraphViewModel
  canCreate: boolean
}>) {
  const bridge = graph.nodes.some(
    (node) => node.data.kind === 'member' && node.data.bridgeLinks.length > 0,
  )
  const tourId = bridge
    ? 'tree-cross-tree'
    : graph.memberCount === 0 && canCreate
      ? 'tree-empty'
      : 'tree-with-members'
  return <GuidedTour tourId={tourId} />
}
