import type { Gender } from '@/core/entities/member'
import type { MemberHref, UnionHref } from '@/presentation/mappers/union-view-models'

/** A marker telling owners and editors that a change waits for review. */
export type PendingBadge = {
  readonly label: string
  readonly tone: 'pending' | 'deletion'
}

/** The other tree a node belongs to, once its branch has been merged into this graph (module 3.3). */
export type ForeignOrigin = { readonly treeId: string; readonly treeName: string }

/** One bridge a local member has into another tree, and whether its branch is currently shown. */
export type BridgeLink = {
  readonly linkId: string
  readonly treeName: string
  readonly expanded: boolean
}

export type MemberNodeData = {
  readonly kind: 'member'
  readonly name: string
  readonly href: MemberHref
  readonly initial: string
  readonly lifespan: string | null
  readonly tribesLabel: string | null
  readonly photoSrc: string | null
  readonly approximate: boolean
  readonly pending: PendingBadge | null
  /** "Pivot", "+1", "−1" in a lineage view; null otherwise. */
  readonly relativeGenerationLabel: string | null
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
  readonly gender: Gender | null
  readonly generation: number
  /** Set once this node comes from a merged foreign branch; null for a node of the tree itself. */
  readonly foreign: ForeignOrigin | null
  /** This member's own bridges into other trees; always empty on a `foreign` node (module 3.3,
   * decision 6 — no chained expansion). */
  readonly bridgeLinks: readonly BridgeLink[]
}

export type UnionNodeData = {
  readonly kind: 'union'
  readonly typeLabel: string
  /** The union's own page, which the node links to; ignored when `foreign` is set. */
  readonly href: UnionHref
  /** The accessible name of that link: the type and the parents' names. */
  readonly label: string
  readonly icon: 'heart' | 'rings' | 'branch'
  readonly pending: PendingBadge | null
  readonly foreign: ForeignOrigin | null
}

export type GraphNodeData = MemberNodeData | UnionNodeData

export type PositionedNode = {
  readonly id: string
  readonly position: { readonly x: number; readonly y: number }
  readonly data: GraphNodeData
}

export type GraphEdge = { readonly id: string; readonly source: string; readonly target: string }

/** Everything the client graph needs, already laid out on the server. */
export type FamilyGraphViewModel = {
  readonly treeId: string
  readonly treeName: string
  readonly treeHref: `/tree/${string}`
  readonly memberCount: number
  readonly nodes: readonly PositionedNode[]
  readonly edges: readonly GraphEdge[]
  /** Nodes a kinship or ancestors result puts forward; the others are dimmed. Null: no emphasis. */
  readonly emphasis: readonly string[] | null
}

export function isMemberNode(
  node: PositionedNode,
): node is PositionedNode & { readonly data: MemberNodeData } {
  return node.data.kind === 'member'
}
