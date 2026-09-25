import 'server-only'
import type { UnionType } from '@/core/entities/union'
import type { FamilyGraph, GraphMember, GraphUnion } from '@/core/use-cases/family-graph-views'
import type { CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import type { PendingAction } from '@/core/use-cases/ports/pending-change-reader'
import { lifespanLabel } from '@/presentation/formatting/partial-date-format'
import { photoSource, type PhotoSourcePolicy } from '@/presentation/formatting/photo-source'
import type {
  BridgeLink,
  ForeignOrigin,
  GraphEdge,
  MemberNodeData,
  PendingBadge,
  UnionNodeData,
} from '@/presentation/graph/family-graph-types'
import { UNION_TYPE_LABELS } from '@/presentation/labels/member-labels'
import { relativeGenerationLabel } from '@/presentation/mappers/lineage-view-models'
import { memberLink, unionHref } from '@/presentation/mappers/union-view-models'
import { DEFAULT_LINEAGE_DEPTH } from '@/presentation/schemas/graph-view-schema'
import { lineageHref } from './graph-view-urls'

export type UnlaidNode = { readonly id: string; readonly data: MemberNodeData | UnionNodeData }

export type UnlaidGraph = {
  readonly nodes: readonly UnlaidNode[]
  readonly edges: readonly GraphEdge[]
}

export type UnlaidGraphOptions = {
  /** Set only when `graph` is a foreign branch merged into another tree's graph (module 3.3). */
  readonly foreign?: ForeignOrigin
  /** This tree's own cross-tree bridges, by member id; never set for a foreign branch itself
   * (module 3.3, decision 6 — a foreign node never shows its own bridge buttons). */
  readonly bridgesByMember?: ReadonlyMap<string, readonly BridgeLink[]>
}

const UNION_ICONS: Readonly<Record<UnionType, UnionNodeData['icon']>> = {
  MARRIAGE: 'heart',
  PARTNERSHIP: 'rings',
  BIOLOGICAL: 'branch',
}

export const memberNodeId = (memberId: string) => `member_${memberId}`
export const unionNodeId = (unionId: string) => `union_${unionId}`

// reason: les nœuds, arêtes et actions utilisent le même instantané autorisé du graphe.
export function toUnlaidGraph(
  graph: FamilyGraph,
  photos: PhotoSourcePolicy | null,
  options: UnlaidGraphOptions = {},
): UnlaidGraph {
  const { foreign = null, bridgesByMember } = options
  const treeId = graph.tree.id
  const pivotId = graph.lineage?.pivot.id ?? null
  const connected = new Set(
    graph.unions.flatMap((union) => [
      ...union.parentIds,
      ...union.children.map(({ childId }) => childId),
    ]),
  )
  return {
    nodes: [
      ...graph.members.map((member) => ({
        id: memberNodeId(member.id),
        data: toMemberNodeData(treeId, member, photos, {
          pivotId,
          connected: connected.has(member.id),
          foreign,
          bridgeLinks: bridgesByMember?.get(member.id) ?? [],
        }),
      })),
      ...graph.unions.map((union) => ({
        id: unionNodeId(union.id),
        data: toUnionNodeData(graph, union, foreign),
      })),
    ],
    edges: graph.unions.flatMap(unionEdges),
  }
}

type MemberNodeContext = {
  readonly connected?: boolean
  readonly pivotId?: string | null
  readonly foreign?: ForeignOrigin | null
  readonly bridgeLinks?: readonly BridgeLink[]
}

// reason: ce mapping explicite conserve les données affichables et leur contexte visuel au même endroit.
export function toMemberNodeData(
  treeId: string,
  member: GraphMember,
  photos: PhotoSourcePolicy | null,
  context: MemberNodeContext = {},
): MemberNodeData {
  const { pivotId = null, foreign = null, bridgeLinks = [] } = context
  const { href, name } = memberLink(treeId, member)
  return {
    kind: 'member',
    name,
    firstName: member.firstName,
    lastName: member.lastName,
    pivotHref:
      context.connected && !foreign && member.id !== pivotId
        ? lineageHref(treeId, member.id, DEFAULT_LINEAGE_DEPTH)
        : null,
    href,
    initial: member.firstName.charAt(0).toLocaleUpperCase('fr'),
    lifespan: lifespanLabel(member.birthDate, member.deathDate),
    tribesLabel: member.tribes.length > 0 ? member.tribes.join(', ') : null,
    photoSrc: photoSource(member.photoUrl, photos),
    approximate: member.certainty === 'APPROXIMATE',
    pending: pendingBadge(member.pendingAction),
    relativeGenerationLabel: relativeGenerationLabel(
      member.relativeGeneration,
      member.id === pivotId,
    ),
    tribes: member.tribes,
    ethnicities: member.ethnicities,
    gender: member.gender,
    generation: member.generation,
    foreign,
    bridgeLinks,
  }
}

function toUnionNodeData(
  graph: FamilyGraph,
  union: GraphUnion,
  foreign: ForeignOrigin | null = null,
): UnionNodeData {
  const typeLabel = UNION_TYPE_LABELS[union.type]
  const names = union.parentIds.flatMap((id) => {
    const parent = graph.members.find((member) => member.id === id)
    return parent ? [memberLink(graph.tree.id, parent).name] : []
  })
  return {
    kind: 'union',
    typeLabel,
    href: unionHref(graph.tree.id, union.id),
    label: names.length > 0 ? `${typeLabel} : ${names.join(' et ')}` : typeLabel,
    icon: UNION_ICONS[union.type],
    pending: pendingBadge(union.pendingAction),
    foreign,
  }
}

/** This tree's cross-tree bridges, keyed by the local member id each one hangs off. */
export function bridgesByMemberFor(
  treeId: string,
  links: readonly CrossTreeLinkView[],
  expandedLinkIds: ReadonlySet<string> = new Set(),
): ReadonlyMap<string, readonly BridgeLink[]> {
  const byMember = new Map<string, BridgeLink[]>()
  for (const view of links) {
    const own = view.link.ownSide(treeId)
    if (!own) continue
    const entry: BridgeLink = {
      linkId: view.link.id,
      treeName: view.linkedTreeName,
      expanded: expandedLinkIds.has(view.link.id),
    }
    byMember.set(own.memberId, [...(byMember.get(own.memberId) ?? []), entry])
  }
  return byMember
}

function unionEdges(union: GraphUnion): GraphEdge[] {
  const unionId = unionNodeId(union.id)
  return [
    ...union.parentIds.map((parentId) => ({
      id: `edge_parent_${union.id}_${parentId}`,
      source: memberNodeId(parentId),
      target: unionId,
    })),
    ...union.children.map(({ childId }) => ({
      id: `edge_child_${union.id}_${childId}`,
      source: unionId,
      target: memberNodeId(childId),
    })),
  ]
}

export function pendingBadge(action: PendingAction | null): PendingBadge | null {
  if (action === null) return null
  return action === 'DELETE'
    ? { label: 'Suppression en attente', tone: 'deletion' }
    : { label: 'En attente', tone: 'pending' }
}
