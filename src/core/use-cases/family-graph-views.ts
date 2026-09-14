import 'server-only'
import type { Family } from '@/core/entities/family'
import type { Certainty, Gender, Member } from '@/core/entities/member'
import type { Filiation, Union, UnionType } from '@/core/entities/union'
import type { MemberId } from '@/core/shared/value-objects/member-id'
import { toMemberSummary, type MemberSummary } from '@/core/use-cases/member-views'
import type { PendingAction } from '@/core/use-cases/ports/pending-change-reader'

export type GraphMember = MemberSummary & {
  readonly gender: Gender | null
  readonly certainty: Certainty
  readonly photoUrl: string | null
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
  readonly generation: number
  readonly pendingAction: PendingAction | null
}

export type GraphUnion = {
  readonly id: string
  readonly type: UnionType
  readonly parentIds: readonly string[]
  readonly children: readonly { readonly childId: string; readonly filiation: Filiation }[]
  readonly pendingAction: PendingAction | null
}

export type FamilyGraph = {
  readonly tree: { readonly id: string; readonly name: string }
  readonly members: readonly GraphMember[]
  readonly unions: readonly GraphUnion[]
}

export type GraphContext = {
  readonly generations: ReadonlyMap<string, number>
  readonly pending: ReadonlyMap<string, PendingAction>
}

export function toGraphMember(member: Member, context: GraphContext): GraphMember {
  const id = member.id.value
  const { gender, certainty, photoUrl } = member.details
  return {
    ...toMemberSummary(member),
    gender,
    certainty,
    photoUrl,
    tribes: member.tribes,
    ethnicities: member.ethnicities,
    generation: context.generations.get(id) ?? 0,
    pendingAction: context.pending.get(id) ?? null,
  }
}

/** A union reduced to its links towards existing members, so that no edge points into the void. */
export function toGraphUnion(union: Union, family: Family, context: GraphContext): GraphUnion {
  const exists = (id: MemberId) => family.findMember(id) !== null
  return {
    id: union.id,
    type: union.type,
    parentIds: union.parentIds.filter(exists).map((id) => id.value),
    children: union.children
      .filter(({ childId }) => exists(childId))
      .map(({ childId, filiation }) => ({ childId: childId.value, filiation })),
    pendingAction: context.pending.get(union.id) ?? null,
  }
}
