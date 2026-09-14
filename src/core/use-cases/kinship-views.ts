import 'server-only'
import type { CommonAncestor } from '@/core/entities/common-ancestors'
import type { Kinship } from '@/core/entities/kinship'
import type { Gender, Member } from '@/core/entities/member'
import { toPersonReference, type PersonReference } from '@/core/use-cases/member-views'

export type GenderedPerson = PersonReference & { readonly gender: Gender | null }

export type KinshipResult = {
  readonly first: GenderedPerson
  readonly second: GenderedPerson
  /** Null when no chain of unions links the two members. */
  readonly relation: Kinship | null
  /** Every member on the path, from the first to the second; empty without a relation. */
  readonly path: readonly GenderedPerson[]
  readonly unionIds: readonly string[]
}

export type CommonAncestorView = {
  readonly person: GenderedPerson
  readonly distanceFromFirst: number
  readonly distanceFromSecond: number
}

export type CommonAncestorsResult = {
  readonly first: GenderedPerson
  readonly second: GenderedPerson
  readonly ancestors: readonly CommonAncestorView[]
}

export function toGenderedPerson(member: Member): GenderedPerson {
  return { ...toPersonReference(member), gender: member.details.gender }
}

export function toCommonAncestorView(ancestor: CommonAncestor): CommonAncestorView {
  return {
    person: toGenderedPerson(ancestor.member),
    distanceFromFirst: ancestor.distanceFromA,
    distanceFromSecond: ancestor.distanceFromB,
  }
}
