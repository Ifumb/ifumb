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
import { GraphFiltersPanel } from '@/presentation/components/family-graph/graph-filters-panel'
import { GraphStatus } from '@/presentation/components/family-graph/graph-status'
import { GraphToolbar } from '@/presentation/components/family-graph/graph-toolbar'
import { MemberNode } from '@/presentation/components/family-graph/member-node'
import { UnionNode } from '@/presentation/components/family-graph/union-node'
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

function FamilyGraphCanvas({ graph }: FamilyGraphProps) {
  const [filters, setFilters] = useState(NO_FILTERS)
  const options = useMemo(() => filterOptions(graph.nodes), [graph.nodes])
  const visible = useMemo(() => visibleNodeIds(graph.nodes, graph.edges, filters), [graph, filters])
  const { inFocus, centre, reset } = useGraphCentring(graph.edges)

  return (
    <div className="space-y-3">
      <GraphToolbar nodes={graph.nodes} visible={visible} onCentre={centre} onReset={reset} />
      <GraphFiltersPanel options={options} filters={filters} onChange={setFilters} />
      <GraphStatus nodes={graph.nodes} visible={visible} total={graph.memberCount} />
      <GraphCanvas graph={graph} visible={visible} inFocus={inFocus} />
    </div>
  )
}

type GraphCanvasProps = FamilyGraphProps &
  Readonly<{ visible: ReadonlySet<string>; inFocus: ReadonlySet<string> | null }>

function GraphCanvas({ graph, visible, inFocus }: GraphCanvasProps) {
  const nodes = useMemo(
    () => graph.nodes.map((node) => toFlowNode(node, visible, inFocus)),
    [graph.nodes, visible, inFocus],
  )
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

/**
 * Member nodes are reached through the link they contain, so the node itself is not focusable.
 * Nodes outside the centred neighbourhood are dimmed and made inert until the view is reset.
 */
function toFlowNode(
  node: PositionedNode,
  visible: ReadonlySet<string>,
  inFocus: ReadonlySet<string> | null,
): Node<GraphNodeData> {
  const dimmed = inFocus !== null && !inFocus.has(node.id)
  const isMember = node.data.kind === 'member'
  return {
    id: node.id,
    type: node.data.kind,
    position: node.position,
    data: node.data,
    hidden: !visible.has(node.id),
    className: dimmed ? 'opacity-30' : undefined,
    ariaRole: isMember ? 'group' : 'img',
    ariaLabel: node.data.kind === 'union' ? unionLabel(node.data) : undefined,
    domAttributes: {
      'aria-roledescription': isMember ? 'membre' : 'union',
      inert: dimmed || undefined,
    },
  }
}

function unionLabel({ typeLabel, pending }: Extract<GraphNodeData, { kind: 'union' }>): string {
  return pending ? `${typeLabel}, ${pending.label.toLocaleLowerCase('fr')}` : typeLabel
}

/** reason: edges are hidden from assistive technology; the member links and profiles already
 * state every relation in text, and React Flow would otherwise announce "Edge from … to …". */
function toFlowEdge(edge: GraphEdge): Edge {
  return { ...edge, type: 'smoothstep', domAttributes: { 'aria-hidden': true } }
}
