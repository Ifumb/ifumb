import { useMemo } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type {
  FamilyGraphViewModel,
  GraphEdge,
  GraphNodeData,
  PositionedNode,
} from '@/presentation/graph/family-graph-types'

const EMPHASIS_CLASS_NAME = 'outline-4 outline-offset-4 outline-forest'

export type NodeSets = Readonly<{
  visible: ReadonlySet<string>
  inFocus: ReadonlySet<string> | null
  emphasis: ReadonlySet<string> | null
}>

export function useFlowNodes(
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
export function toFlowEdge(edge: GraphEdge): Edge {
  return { ...edge, type: 'smoothstep', domAttributes: { 'aria-hidden': true } }
}
