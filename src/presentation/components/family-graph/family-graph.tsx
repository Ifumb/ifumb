'use client'

import { GuidedTour } from '@/presentation/components/navigation/guided-tour'
import '@xyflow/react/dist/style.css'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type ReactFlowProps,
} from '@xyflow/react'
import { useMemo, useState } from 'react'
import { useGraphPositions } from '@/presentation/components/family-graph/use-graph-positions'
import { GraphInteractionControls } from '@/presentation/components/family-graph/graph-interaction-controls'
import type { FamilyGraphPresentationProps } from '@/presentation/components/family-graph/graph-presentation-props'
import { CrossTreeBranchProvider } from '@/presentation/components/family-graph/cross-tree-branch-context'
import { GraphFiltersPanel } from '@/presentation/components/family-graph/graph-filters-panel'
import { GraphStatus } from '@/presentation/components/family-graph/graph-status'
import { GraphToolbar } from '@/presentation/components/family-graph/graph-toolbar'
import { MemberNode } from '@/presentation/components/family-graph/member-node'
import { UnionNode } from '@/presentation/components/family-graph/union-node'
import { useCrossTreeBranches } from '@/presentation/components/family-graph/use-cross-tree-branches'
import { useGraphCentring } from '@/presentation/components/family-graph/use-graph-centring'
import { useFlowNodes, toFlowEdge, type NodeSets } from './flow-nodes'
import { OVERVIEW_FIT } from '@/presentation/graph/graph-dimensions'
import { filterOptions, NO_FILTERS, visibleNodeIds } from '@/presentation/graph/graph-filters'

const NODE_TYPES: NodeTypes = { member: MemberNode, union: UnionNode }

const ARIA_LABELS = {
  'controls.ariaLabel': 'Contrôles du graphe',
  'controls.zoomIn.ariaLabel': 'Zoom avant',
  'controls.zoomOut.ariaLabel': 'Zoom arrière',
  'controls.fitView.ariaLabel': 'Ajuster la vue',
}

const BACKGROUND_DOT_COLOR = 'var(--color-earth-sand)'

// reason: déplacer les nœuds ajuste seulement la vue locale ; les relations restent immuables.
const FLOW_PROPS = {
  nodeTypes: NODE_TYPES,
  fitView: true,
  fitViewOptions: OVERVIEW_FIT,
  minZoom: 0.1,
  nodesDraggable: false,
  nodesConnectable: false,
  nodesFocusable: false,
  edgesFocusable: false,
  elementsSelectable: false,
  disableKeyboardA11y: true,
  ariaLabelConfig: ARIA_LABELS,
} satisfies ReactFlowProps

type FamilyGraphProps = FamilyGraphPresentationProps

/** The interactive family graph: read-only nodes, zoom, centring on a member and filters. */
export function FamilyGraph(props: FamilyGraphProps) {
  return (
    <ReactFlowProvider>
      <FamilyGraphCanvas {...props} />
    </ReactFlowProvider>
  )
}

// reason: le JSX compose les contrôles autour du canevas en conservant leurs états locaux.
function FamilyGraphCanvas({
  graph: initialGraph,
  tools,
  result,
  actions,
  connections,
}: FamilyGraphProps) {
  const branches = useCrossTreeBranches(initialGraph)
  const graph = branches.graph
  const [filters, setFilters] = useState(NO_FILTERS)
  const options = useMemo(() => filterOptions(graph.nodes), [graph.nodes])
  const visible = useMemo(() => visibleNodeIds(graph.nodes, graph.edges, filters), [graph, filters])
  const { inFocus, centre, reset } = useGraphCentring(graph.edges)

  return (
    <div className="family-graph">
      <GuidedTour
        tourId={graph.memberCount === 0 && actions ? 'tree-empty' : 'tree-with-members'}
      />
      <div className="graph-primary-tools">
        {actions}
        <GraphToolbar nodes={graph.nodes} visible={visible} onCentre={centre} onReset={reset} />
      </div>
      <div className="graph-side-tools">
        <GraphFiltersPanel options={options} filters={filters} onChange={setFilters} />
        {tools}
        {connections}
      </div>
      <div className="graph-status">
        <GraphStatus nodes={graph.nodes} visible={visible} total={graph.memberCount} />
      </div>
      <div className="graph-result">{result}</div>
      {branches.error && (
        <p
          role="alert"
          className="absolute bottom-4 left-16 z-20 rounded bg-white p-3 text-brand-dark"
        >
          {branches.error}
        </p>
      )}
      <CrossTreeBranchProvider
        value={{
          expandedLinkIds: branches.expandedLinkIds,
          pendingLinkId: branches.pendingLinkId,
          onToggle: branches.toggle,
        }}
      >
        <GraphCanvas
          key={graph.nodes.map((node) => node.id).join('|')}
          graph={graph}
          visible={visible}
          inFocus={inFocus}
        />
      </CrossTreeBranchProvider>
    </div>
  )
}

type GraphCanvasProps = FamilyGraphProps & Omit<NodeSets, 'emphasis'>

// reason: les contrôles partagent les états locaux de verrouillage et de placement.
function GraphCanvas({ graph, visible, inFocus }: GraphCanvasProps) {
  const [minimap, setMinimap] = useState(false)
  const [locked, setLocked] = useState(false)
  const layout = useGraphPositions()
  const nodes = useFlowNodes(graph, visible, inFocus)
  const edges = useMemo(() => graph.edges.map(toFlowEdge), [graph.edges])

  return (
    <div className="graph-canvas">
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          position: layout.positions[node.id] ?? node.position,
        }))}
        edges={edges}
        {...FLOW_PROPS}
        onNodesChange={layout.onNodesChange}
        nodesDraggable={!locked}
        panOnDrag={!locked}
        zoomOnScroll={!locked}
        zoomOnPinch={!locked}
      >
        <Background color={BACKGROUND_DOT_COLOR} gap={20} />
        <Controls showInteractive={false} position="bottom-left">
          <GraphInteractionControls
            locked={locked}
            onToggle={() => setLocked(!locked)}
            onResetLayout={layout.reset}
          />
        </Controls>
        {minimap && <MiniMap pannable zoomable nodeColor="var(--color-earth-sand)" />}
      </ReactFlow>
      <button
        type="button"
        className="graph-minimap-toggle"
        aria-pressed={minimap}
        onClick={() => setMinimap(!minimap)}
      >
        {minimap ? 'Masquer la minimap' : 'Afficher minimap'}
      </button>
    </div>
  )
}
