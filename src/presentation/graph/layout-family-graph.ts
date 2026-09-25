import 'server-only'
import type { PhotoSourcePolicy } from '@/presentation/formatting/photo-source'
import dagre from '@dagrejs/dagre'
import type { CrossTreeBranch } from '@/core/use-cases/get-cross-tree-branch'
import type { FamilyGraph } from '@/core/use-cases/family-graph-views'
import type { CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import type {
  FamilyGraphViewModel,
  GraphEdge,
  PositionedNode,
} from '@/presentation/graph/family-graph-types'
import {
  MEMBER_NODE_SIZE,
  memberNodeHeight,
  UNION_NODE_SIZE,
} from '@/presentation/graph/graph-dimensions'
import {
  bridgesByMemberFor,
  memberNodeId,
  toUnlaidGraph,
  type UnlaidGraph,
  type UnlaidNode,
} from '@/presentation/graph/family-graph-view-models'

// Spacing carried over from the legacy layout (top to bottom, generations as ranks).
const LAYOUT_OPTIONS = { rankdir: 'TB', nodesep: 50, ranksep: 60, marginx: 40, marginy: 40 }

export function toFamilyGraphViewModel(
  graph: FamilyGraph,
  photos: PhotoSourcePolicy | null,
  links: readonly CrossTreeLinkView[] = [],
): FamilyGraphViewModel {
  const bridgesByMember = bridgesByMemberFor(graph.tree.id, links)
  const { nodes, edges } = toUnlaidGraph(graph, photos, { bridgesByMember })
  return {
    treeId: graph.tree.id,
    treeName: graph.tree.name,
    treeHref: `/tree/${graph.tree.id}`,
    memberCount: graph.members.length,
    nodes: layoutNodes(nodes, edges),
    edges,
    emphasis: null,
  }
}

/**
 * The local graph plus zero or more foreign branches merged into it, laid out as a single graph
 * (module 3.3). Each branch's pivot node (the member on the foreign side of its `CrossTreeLink`) is
 * dropped and its edges rewritten onto the local bridge member's own node id, so the merged graph
 * stays one connected component — without that, dagre would place the branch as a disconnected,
 * arbitrarily positioned cluster.
 */
// reason: la composition associe quatre entrées distinctes sans modifier les graphes sources.
export function toMergedFamilyGraphViewModel(
  localGraph: FamilyGraph,
  links: readonly CrossTreeLinkView[],
  branches: readonly CrossTreeBranch[],
  photos: PhotoSourcePolicy | null,
): FamilyGraphViewModel {
  const expandedLinkIds = new Set(branches.map((branch) => branch.link.id))
  const bridgesByMember = bridgesByMemberFor(localGraph.tree.id, links, expandedLinkIds)
  const merged = branches.reduce<UnlaidGraph>(
    (accumulated, branch) => mergeForeignBranch(accumulated, branch, localGraph.tree.id, photos),
    toUnlaidGraph(localGraph, photos, { bridgesByMember }),
  )
  // Counts every member node actually in the merged graph, not just the local tree's own — a
  // branch can add members, and `GraphStatus` compares this against how many nodes it renders.
  const memberCount = merged.nodes.filter((node) => node.data.kind === 'member').length
  return {
    treeId: localGraph.tree.id,
    treeName: localGraph.tree.name,
    treeHref: `/tree/${localGraph.tree.id}`,
    memberCount,
    nodes: layoutNodes(merged.nodes, merged.edges),
    edges: merged.edges,
    emphasis: null,
  }
}

/** Merges one foreign branch into an already-built graph; pure, so it is tested on its own. */
// reason: le remappage du pivot et la déduplication des arêtes partagent la même correspondance.
export function mergeForeignBranch(
  accumulated: UnlaidGraph,
  branch: CrossTreeBranch,
  localTreeId: string,
  photos: PhotoSourcePolicy | null,
): UnlaidGraph {
  const ownSide = branch.link.ownSide(localTreeId)
  const foreignSide = branch.link.otherSide(localTreeId)
  if (!ownSide || !foreignSide) return accumulated

  const foreign = { treeId: branch.foreignGraph.tree.id, treeName: branch.foreignGraph.tree.name }
  const foreignUnlaid = toUnlaidGraph(branch.foreignGraph, photos, { foreign })
  const foreignPivotNodeId = memberNodeId(foreignSide.memberId)
  const localBridgeNodeId = memberNodeId(ownSide.memberId)
  const remap = (id: string) => (id === foreignPivotNodeId ? localBridgeNodeId : id)

  const nodes = new Map(accumulated.nodes.map((node) => [node.id, node] as const))
  for (const node of foreignUnlaid.nodes) {
    // The foreign pivot is dropped: the local bridge member already stands for this same person.
    if (node.id !== foreignPivotNodeId && !nodes.has(node.id)) nodes.set(node.id, node)
  }

  const edges = new Map(accumulated.edges.map((edge) => [edge.id, edge] as const))
  for (const edge of foreignUnlaid.edges) {
    const rewritten = { ...edge, source: remap(edge.source), target: remap(edge.target) }
    if (!edges.has(rewritten.id)) edges.set(rewritten.id, rewritten)
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] }
}

/**
 * Positions nodes with dagre, then orders them top to bottom and left to right: React Flow renders
 * nodes in array order, so this order is also the keyboard order through the member links.
 */
// reason: les mutations de dagre restent confinées à cette fonction de placement.
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
  if (node.data.kind !== 'member') return UNION_NODE_SIZE
  return {
    width: MEMBER_NODE_SIZE.width,
    height: memberNodeHeight(node.data.bridgeLinks.length, node.data.pivotHref !== null),
  }
}

function centerOf(node: PositionedNode) {
  const { width, height } = sizeOf(node)
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
}
