import 'server-only'
import type { UnionType } from '@/core/entities/union'
import type { FamilyGraph, GraphMember, GraphUnion } from '@/core/use-cases/family-graph-views'
import type { PendingAction } from '@/core/use-cases/ports/pending-change-reader'
import { lifespanLabel } from '@/presentation/formatting/partial-date-format'
import type {
  GraphEdge,
  MemberNodeData,
  PendingBadge,
  UnionNodeData,
} from '@/presentation/graph/family-graph-types'
import { UNION_TYPE_LABELS } from '@/presentation/labels/member-labels'
import { relativeGenerationLabel } from '@/presentation/mappers/lineage-view-models'
import { memberLink, unionHref } from '@/presentation/mappers/union-view-models'

/** Where member photos may come from; any other URL falls back to the initial. */
export type PhotoSourcePolicy = { readonly origin: string; readonly pathPrefix: string }

export type UnlaidNode = { readonly id: string; readonly data: MemberNodeData | UnionNodeData }

export type UnlaidGraph = {
  readonly nodes: readonly UnlaidNode[]
  readonly edges: readonly GraphEdge[]
}

const UNION_ICONS: Readonly<Record<UnionType, UnionNodeData['icon']>> = {
  MARRIAGE: 'heart',
  PARTNERSHIP: 'rings',
  BIOLOGICAL: 'branch',
}

export const memberNodeId = (memberId: string) => `member_${memberId}`
export const unionNodeId = (unionId: string) => `union_${unionId}`

export function toUnlaidGraph(graph: FamilyGraph, photos: PhotoSourcePolicy | null): UnlaidGraph {
  const treeId = graph.tree.id
  const pivotId = graph.lineage?.pivot.id ?? null
  return {
    nodes: [
      ...graph.members.map((member) => ({
        id: memberNodeId(member.id),
        data: toMemberNodeData(treeId, member, photos, pivotId),
      })),
      ...graph.unions.map((union) => ({
        id: unionNodeId(union.id),
        data: toUnionNodeData(graph, union),
      })),
    ],
    edges: graph.unions.flatMap(unionEdges),
  }
}

export function toMemberNodeData(
  treeId: string,
  member: GraphMember,
  photos: PhotoSourcePolicy | null,
  pivotId: string | null = null,
): MemberNodeData {
  const { href, name } = memberLink(treeId, member)
  return {
    kind: 'member',
    name,
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
  }
}

function toUnionNodeData(graph: FamilyGraph, union: GraphUnion): UnionNodeData {
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
  }
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

/** The photo URL when it points into the allowed bucket, so `next/image` accepts it. */
export function photoSource(url: string | null, policy: PhotoSourcePolicy | null): string | null {
  if (url === null || policy === null || !URL.canParse(url)) return null
  const parsed = new URL(url)
  const allowed = parsed.origin === policy.origin && parsed.pathname.startsWith(policy.pathPrefix)
  return allowed ? parsed.href : null
}
