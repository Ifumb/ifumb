import 'server-only'
import type { Member, MemberFacts } from '@/core/entities/member'
import type { ParentUnion, PartnerUnion } from '@/core/entities/family'
import type { Filiation, UnionType } from '@/core/entities/union'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'

/** A member named in a relation, with what is needed to link to them. */
export type PersonReference = {
  readonly id: string
  readonly firstName: string
  readonly lastName: string | null
}

export type MemberSummary = PersonReference & {
  readonly nickname: string | null
  readonly birthDate: PartialDate | null
  readonly birthDateApprox: boolean
  readonly deathDate: PartialDate | null
  readonly tribe: string | null
  readonly ethnicity: string | null
}

export type MemberDetails = Omit<MemberFacts, 'id'> & { readonly id: string }

type UnionFacts = {
  readonly id: string
  readonly type: UnionType
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
}

export type ParentUnionView = UnionFacts & {
  readonly parents: readonly PersonReference[]
  readonly filiation: Filiation
}

export type PartnerUnionView = UnionFacts & {
  readonly partner: PersonReference | null
  readonly children: readonly { readonly person: PersonReference; readonly filiation: Filiation }[]
}

export function toPersonReference(member: Member): PersonReference {
  return { id: member.id.value, firstName: member.firstName, lastName: member.lastName }
}

export function toMemberSummary(member: Member): MemberSummary {
  const { nickname, birthDate, birthDateApprox, deathDate, tribe, ethnicity } = member.details
  return {
    ...toPersonReference(member),
    nickname,
    birthDate,
    birthDateApprox,
    deathDate,
    tribe,
    ethnicity,
  }
}

/** Every fact of a member, without who claimed it: that stays a matter of access rules. */
export function toMemberDetails(member: Member): MemberDetails {
  return { ...member.details, id: member.id.value }
}

export function toParentUnionView({ union, parents, filiation }: ParentUnion): ParentUnionView {
  return { ...unionFacts(union), parents: parents.map(toPersonReference), filiation }
}

export function toPartnerUnionView({ union, partner, children }: PartnerUnion): PartnerUnionView {
  return {
    ...unionFacts(union),
    partner: partner ? toPersonReference(partner) : null,
    children: children.map(({ member, filiation }) => ({
      person: toPersonReference(member),
      filiation,
    })),
  }
}

function unionFacts(union: ParentUnion['union']): UnionFacts {
  return { id: union.id, type: union.type, startDate: union.startDate, endDate: union.endDate }
}
