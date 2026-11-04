import { CommonAncestorsPanel } from '@/presentation/components/family-graph/common-ancestors-panel'
import { CrossTreeConnectionsPanel } from '@/presentation/components/family-graph/cross-tree-connections-panel'
import { KinshipPanel } from '@/presentation/components/family-graph/kinship-panel'
import { LineageFormPanel } from '@/presentation/components/family-graph/lineage-form-panel'
import type { GraphToolsViewModel } from '@/presentation/mappers/graph-tools-view-models'

type GraphToolsViewProps = Readonly<{
  treeId: string
  tools: GraphToolsViewModel
  canManageConnections: boolean
}>

/** The graph tools: all floating popovers (module: mobile/keyboard parity) — Descendance still
 * submits to a real, shareable URL (`tools.action`), only its shell and member picker now match
 * the other three. Connexions writes (compute, accept, reject), so — like the legacy app — it
 * only renders for a viewer who can contribute to the tree. */
export function GraphToolsView({ treeId, tools, canManageConnections }: GraphToolsViewProps) {
  return (
    <div className="graph-mode-tools">
      <LineageFormPanel tools={tools} />
      <KinshipPanel treeId={treeId} people={tools.people} />
      <CommonAncestorsPanel treeId={treeId} people={tools.people} />
      {canManageConnections && <CrossTreeConnectionsPanel treeId={treeId} />}
    </div>
  )
}
