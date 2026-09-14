import 'server-only'
import { Member } from '@/core/entities/member'
import { Union } from '@/core/entities/union'
import { MemberId } from '@/core/shared/value-objects/member-id'
import { PartialDate } from '@/core/shared/value-objects/partial-date'
import type {
  Member as MemberRow,
  Union as UnionRow,
  UnionChild as UnionChildRow,
} from '@/infrastructure/persistence/prisma/generated/client'

export type UnionWithChildrenRow = UnionRow & {
  readonly children: readonly Pick<UnionChildRow, 'childId' | 'filiationType'>[]
}

export function toDomainMember(row: MemberRow): Member {
  return Member.create({
    id: MemberId.fromString(row.id),
    firstName: row.firstName,
    lastName: row.lastName,
    nickname: row.nickname,
    gender: row.gender,
    birthDate: optionalPartialDate(row.birthDate),
    birthDateApprox: row.birthDateApprox,
    deathDate: optionalPartialDate(row.deathDate),
    birthPlace: row.birthPlace,
    tribe: row.tribe,
    clan: row.clan,
    ethnicity: row.ethnicity,
    originRegion: row.originRegion,
    biography: row.biography,
    certainty: row.certainty,
    photoUrl: row.photoUrl,
    claimedById: row.claimedByUserId,
  })
}

export function toDomainUnion(row: UnionWithChildrenRow): Union {
  return Union.create({
    id: row.id,
    type: row.type,
    startDate: optionalPartialDate(row.startDate),
    endDate: optionalPartialDate(row.endDate),
    parent1Id: row.parent1Id ? MemberId.fromString(row.parent1Id) : null,
    parent2Id: row.parent2Id ? MemberId.fromString(row.parent2Id) : null,
    children: row.children.map((child) => ({
      childId: MemberId.fromString(child.childId),
      filiation: child.filiationType,
    })),
  })
}

/**
 * reason: a stored date in none of the known formats is shown as unknown rather than failing the
 * whole page — legacy data was never validated consistently (see the plan of module 1.1).
 */
export function optionalPartialDate(raw: string | null): PartialDate | null {
  if (raw === null) return null
  const parsed = PartialDate.parse(raw)
  return parsed.ok ? parsed.value : null
}
