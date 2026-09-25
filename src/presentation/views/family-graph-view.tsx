import { FamilyGraphIsland } from '@/presentation/components/family-graph/family-graph-island'
import type { FamilyGraphPresentationProps } from '@/presentation/components/family-graph/graph-presentation-props'

export function FamilyGraphView(props: FamilyGraphPresentationProps) {
  return (
    <div className="tree-stage">
      <FamilyGraphIsland {...props} />
    </div>
  )
}
