import 'server-only'
import dagre from '@dagrejs/dagre'
import type { FamilyGraph } from '@/core/use-cases/family-graph-views'
import type {
  FamilyGraphViewModel,
  GraphEdge,
  PositionedNode,
} from '@/presentation/graph/family-graph-types'
import { MEMBER_NODE_SIZE, UNION_NODE_SIZE } from '@/presentation/graph/graph-dimensions'
import {
  toUnlaidGraph,
  type PhotoSourcePolicy,
  type UnlaidNode,
} from '@/presentation/graph/family-graph-view-models'

// Spacing carried over from the legacy layout (top to bottom, generations as ranks).
const LAYOUT_OPTIONS = { rankdir: 'TB', nodesep: 50, ranksep: 60, marginx: 40, marginy: 40 }

export function toFamilyGraphViewModel(
  graph: FamilyGraph,
  photos: PhotoSourcePolicy | null,
): FamilyGraphViewModel {
  const { nodes, edges } = toUnlaidGraph(graph, photos)
  return {
    treeName: graph.tree.name,
    treeHref: `/tree/${graph.tree.id}`,
    memberCount: graph.members.length,
    nodes: layoutNodes(nodes, edges),
    edges,
    emphasis: null,
  }
}

/**
 * Positions nodes with dagre, then orders them top to bottom and left to right: React Flow renders
 * nodes in array order, so this order is also the keyboard order through the member links.
 */
export function layoutNodes(
  nodes: readonly UnlaidNode[],
  edges: readonly GraphEdge[],
): PositionedNode[] {
  const graph = new dagre.graphlib.Graph()
  graph.setGraph(LAYOUT_OPTIONS)
  graph.setDefaultEdgeLabel(() => ({}))
  nodes.forEach((node) => graph.setNode(node.id, { ...sizeOf(node) }))
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target))
  dagre.layout(graph)

  return nodes
    .map((node) => {
      const { x, y } = graph.node(node.id)
      const { width, height } = sizeOf(node)
      return { ...node, position: { x: x - width / 2, y: y - height / 2 } }
    })
    .sort(
      (a, b) =>
        centerOf(a).y - centerOf(b).y || centerOf(a).x - centerOf(b).x || a.id.localeCompare(b.id),
    )
}

function sizeOf(node: UnlaidNode) {
  return node.data.kind === 'member' ? MEMBER_NODE_SIZE : UNION_NODE_SIZE
}

function centerOf(node: PositionedNode) {
  const { width, height } = sizeOf(node)
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
}
