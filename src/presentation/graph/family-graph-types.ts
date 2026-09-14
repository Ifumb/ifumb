import type { Gender } from '@/core/entities/member'
import type { MemberHref } from '@/presentation/mappers/union-view-models'

/** A marker telling owners and editors that a change waits for review. */
export type PendingBadge = {
  readonly label: string
  readonly tone: 'pending' | 'deletion'
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
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
  readonly gender: Gender | null
  readonly generation: number
}

export type UnionNodeData = {
  readonly kind: 'union'
  readonly typeLabel: string
  readonly icon: 'heart' | 'rings' | 'branch'
  readonly pending: PendingBadge | null
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
  readonly treeName: string
  readonly treeHref: `/tree/${string}`
  readonly memberCount: number
  readonly nodes: readonly PositionedNode[]
  readonly edges: readonly GraphEdge[]
}

export function isMemberNode(
  node: PositionedNode,
): node is PositionedNode & { readonly data: MemberNodeData } {
  return node.data.kind === 'member'
}
