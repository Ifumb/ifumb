import type { Family } from '@/core/entities/family'
import { MemberId } from '@/core/shared/value-objects/member-id'

/** Ids of the recorded parents of a member, existing members only. */
export function parentIdsOf(family: Family, memberId: string): string[] {
  return family
    .parentUnionsOf(MemberId.fromString(memberId))
    .flatMap(({ parents }) => parents.map((parent) => parent.id.value))
}

/** Ids of the recorded children of a member, existing members only. */
export function childIdsOf(family: Family, memberId: string): string[] {
  return family
    .partnerUnionsOf(MemberId.fromString(memberId))
    .flatMap(({ children }) => children.map((child) => child.member.id.value))
}
