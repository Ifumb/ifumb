import 'server-only'
import type { Family } from '@/core/entities/family'
import type { Lineage, LineageDepth } from '@/core/entities/lineage'
import type { Certainty, Gender, Member } from '@/core/entities/member'
import type { Tree } from '@/core/entities/tree'
import type { Filiation, Union, UnionType } from '@/core/entities/union'
import {
  toMemberSummary,
  toPersonReference,
  type MemberSummary,
  type PersonReference,
} from '@/core/use-cases/member-views'
import type { PendingAction } from '@/core/use-cases/ports/pending-change-reader'

export type GraphMember = MemberSummary & {
  readonly gender: Gender | null
  readonly certainty: Certainty
  readonly photoUrl: string | null
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
  readonly generation: number
  /** Generation relative to the lineage pivot; null outside a lineage view. */
  readonly relativeGeneration: number | null
  readonly pendingAction: PendingAction | null
}

export type GraphUnion = {
  readonly id: string
  readonly type: UnionType
  readonly parentIds: readonly string[]
  readonly children: readonly { readonly childId: string; readonly filiation: Filiation }[]
  readonly pendingAction: PendingAction | null
}

export type LineageView = LineageDepth & {
  readonly pivot: PersonReference
  readonly hasDescendants: boolean
  readonly deepestDescendantShown: number
}

export type FamilyGraph = {
  readonly tree: { readonly id: string; readonly name: string }
  /** Every member of the tree, in name order, whatever part of the graph is shown. */
  readonly people: readonly PersonReference[]
  readonly members: readonly GraphMember[]
  readonly unions: readonly GraphUnion[]
  readonly lineage: LineageView | null
}

/** The part of the family a graph shows: all of it, or one lineage around its pivot. */
export type GraphScope =
  | { readonly kind: 'whole' }
  | { readonly kind: 'lineage'; readonly lineage: Lineage; readonly view: LineageView }

export type GraphFacts = {
  readonly generations: ReadonlyMap<string, number>
  readonly pending: ReadonlyMap<string, PendingAction>
}

export function toFamilyGraph(tree: Tree, family: Family, scope: GraphScope, facts: GraphFacts) {
  const lineage = scope.kind === 'lineage' ? scope.lineage : null
  const shown = (memberId: string) => !lineage || lineage.relativeGenerations.has(memberId)
  const relative = (memberId: string) => lineage?.relativeGenerations.get(memberId) ?? null
  const members = family.members()
  return {
    tree: { id: tree.id.value, name: tree.name },
    people: members.map(toPersonReference),
    members: members
      .filter((member) => shown(member.id.value))
      .map((member) => toGraphMember(member, facts, relative(member.id.value))),
    unions: family
      .unions()
      .filter((union) => !lineage || lineage.unionIds.has(union.id))
      .map((union) => toGraphUnion(union, family, shown, facts)),
    lineage: scope.kind === 'lineage' ? scope.view : null,
  } satisfies FamilyGraph
}

function toGraphMember(member: Member, facts: GraphFacts, relativeGeneration: number | null) {
  const id = member.id.value
  const { gender, certainty, photoUrl } = member.details
  return {
    ...toMemberSummary(member),
    gender,
    certainty,
    photoUrl,
    tribes: member.tribes,
    ethnicities: member.ethnicities,
    generation: facts.generations.get(id) ?? 0,
    relativeGeneration,
    pendingAction: facts.pending.get(id) ?? null,
  } satisfies GraphMember
}

/** A union reduced to its links towards shown members, so that no edge points into the void. */
function toGraphUnion(
  union: Union,
  family: Family,
  shown: (memberId: string) => boolean,
  facts: GraphFacts,
): GraphUnion {
  const linked = (id: Member['id']) => family.findMember(id) !== null && shown(id.value)
  return {
    id: union.id,
    type: union.type,
    parentIds: union.parentIds.filter(linked).map((id) => id.value),
    children: union.children
      .filter(({ childId }) => linked(childId))
      .map(({ childId, filiation }) => ({ childId: childId.value, filiation })),
    pendingAction: facts.pending.get(union.id) ?? null,
  }
}
