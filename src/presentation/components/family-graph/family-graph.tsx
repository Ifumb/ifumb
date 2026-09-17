'use client'

import '@xyflow/react/dist/style.css'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowProps,
} from '@xyflow/react'
import { useMemo, useState } from 'react'
import { CrossTreeBranchProvider } from '@/presentation/components/family-graph/cross-tree-branch-context'
import { GraphFiltersPanel } from '@/presentation/components/family-graph/graph-filters-panel'
import { GraphStatus } from '@/presentation/components/family-graph/graph-status'
import { GraphToolbar } from '@/presentation/components/family-graph/graph-toolbar'
import { MemberNode } from '@/presentation/components/family-graph/member-node'
import { UnionNode } from '@/presentation/components/family-graph/union-node'
import { useCrossTreeBranches } from '@/presentation/components/family-graph/use-cross-tree-branches'
import { useGraphCentring } from '@/presentation/components/family-graph/use-graph-centring'
import type {
  FamilyGraphViewModel,
  GraphEdge,
  GraphNodeData,
  PositionedNode,
} from '@/presentation/graph/family-graph-types'
import { GRAPH_CANVAS_HEIGHT, OVERVIEW_FIT } from '@/presentation/graph/graph-dimensions'
import { filterOptions, NO_FILTERS, visibleNodeIds } from '@/presentation/graph/graph-filters'

const NODE_TYPES: NodeTypes = { member: MemberNode, union: UnionNode }

const ARIA_LABELS = {
  'controls.ariaLabel': 'Contrôles du graphe',
  'controls.zoomIn.ariaLabel': 'Zoom avant',
  'controls.zoomOut.ariaLabel': 'Zoom arrière',
  'controls.fitView.ariaLabel': 'Ajuster la vue',
}

const BACKGROUND_DOT_COLOR = '#d6c9a8'

// Forest green on white stays above the 3:1 contrast required for a graphical cue (WCAG 1.4.11).
const EMPHASIS_CLASS_NAME = 'outline-4 outline-offset-4 outline-forest'

/** A graph to read: nothing is dragged, connected or selected, and nodes are not focus stops. */
const READ_ONLY_FLOW_PROPS = {
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

type FamilyGraphProps = Readonly<{ graph: FamilyGraphViewModel }>

/** The interactive family graph: read-only nodes, zoom, centring on a member and filters. */
export function FamilyGraph({ graph }: FamilyGraphProps) {
  return (
    <ReactFlowProvider>
      <FamilyGraphCanvas graph={graph} />
    </ReactFlowProvider>
  )
}

function FamilyGraphCanvas({ graph: initialGraph }: FamilyGraphProps) {
  const branches = useCrossTreeBranches(initialGraph)
  const graph = branches.graph
  const [filters, setFilters] = useState(NO_FILTERS)
  const options = useMemo(() => filterOptions(graph.nodes), [graph.nodes])
  const visible = useMemo(() => visibleNodeIds(graph.nodes, graph.edges, filters), [graph, filters])
  const { inFocus, centre, reset } = useGraphCentring(graph.edges)

  return (
    <div className="space-y-3">
      <GraphToolbar nodes={graph.nodes} visible={visible} onCentre={centre} onReset={reset} />
      <GraphFiltersPanel options={options} filters={filters} onChange={setFilters} />
      <GraphStatus nodes={graph.nodes} visible={visible} total={graph.memberCount} />
      {branches.error && (
        <p role="alert" className="text-brand-dark">
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
        <GraphCanvas graph={graph} visible={visible} inFocus={inFocus} />
      </CrossTreeBranchProvider>
    </div>
  )
}

type NodeSets = Readonly<{
  visible: ReadonlySet<string>
  inFocus: ReadonlySet<string> | null
  emphasis: ReadonlySet<string> | null
}>

type GraphCanvasProps = FamilyGraphProps & Omit<NodeSets, 'emphasis'>

function GraphCanvas({ graph, visible, inFocus }: GraphCanvasProps) {
  const nodes = useFlowNodes(graph, visible, inFocus)
  const edges = useMemo(() => graph.edges.map(toFlowEdge), [graph.edges])

  return (
    <div
      style={{ height: GRAPH_CANVAS_HEIGHT }}
      className="overflow-hidden rounded-lg border border-earth-sand bg-white"
    >
      <ReactFlow nodes={nodes} edges={edges} {...READ_ONLY_FLOW_PROPS}>
        <Background color={BACKGROUND_DOT_COLOR} gap={20} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  )
}

function useFlowNodes(
  graph: FamilyGraphViewModel,
  visible: NodeSets['visible'],
  inFocus: NodeSets['inFocus'],
) {
  const emphasis = useMemo(
    () => (graph.emphasis ? new Set(graph.emphasis) : null),
    [graph.emphasis],
  )
  return useMemo(
    () => graph.nodes.map((node) => toFlowNode(node, { visible, inFocus, emphasis })),
    [graph.nodes, visible, inFocus, emphasis],
  )
}

/**
 * Member nodes are reached through the link they contain, so the node itself is not focusable.
 * Nodes outside the centred neighbourhood, or outside a result's emphasis, are dimmed and inert;
 * the result itself is also written out in text above the graph.
 */
function toFlowNode(node: PositionedNode, sets: NodeSets): Node<GraphNodeData> {
  const outside = (set: ReadonlySet<string> | null) => set !== null && !set.has(node.id)
  const dimmed = outside(sets.inFocus) || outside(sets.emphasis)
  const isMember = node.data.kind === 'member'
  return {
    id: node.id,
    type: node.data.kind,
    position: node.position,
    data: node.data,
    hidden: !sets.visible.has(node.id),
    className: nodeClassName(dimmed, sets.emphasis?.has(node.id) ?? false, isMember),
    ariaRole: 'group',
    domAttributes: {
      'aria-roledescription': isMember ? 'membre' : 'union',
      inert: dimmed || undefined,
    },
  }
}

function nodeClassName(dimmed: boolean, emphasized: boolean, isMember: boolean) {
  if (dimmed) return 'opacity-30'
  if (!emphasized) return undefined
  return [EMPHASIS_CLASS_NAME, isMember ? 'rounded-xl' : 'rounded-full'].join(' ')
}

/** reason: edges are hidden from assistive technology; the member links and profiles already
 * state every relation in text, and React Flow would otherwise announce "Edge from … to …". */
function toFlowEdge(edge: GraphEdge): Edge {
  return { ...edge, type: 'smoothstep', domAttributes: { 'aria-hidden': true } }
}
