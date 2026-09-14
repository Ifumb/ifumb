import { Member, type MemberProps } from '@/core/entities/member'
import { Union, type UnionProps } from '@/core/entities/union'
import { MemberId } from '@/core/shared/value-objects/member-id'
import { PartialDate } from '@/core/shared/value-objects/partial-date'

export function dateOf(raw: string): PartialDate {
  const parsed = PartialDate.parse(raw)
  if (!parsed.ok) throw new Error(`Invalid partial date in test fixture: ${raw}`)
  return parsed.value
}

export function memberId(value: string): MemberId {
  return MemberId.fromString(value)
}

export function aMember(overrides: Partial<MemberProps> = {}): Member {
  return Member.create({
    id: memberId('mbr_awa'),
    firstName: 'Awa',
    lastName: 'Diallo',
    nickname: null,
    gender: 'FEMALE',
    birthDate: null,
    birthDateApprox: false,
    deathDate: null,
    birthPlace: null,
    tribe: null,
    clan: null,
    ethnicity: null,
    originRegion: null,
    biography: null,
    certainty: 'CONFIRMED',
    ...overrides,
  })
}

export function aUnion(overrides: Partial<UnionProps> = {}): Union {
  return Union.create({
    id: 'uni_1',
    type: 'MARRIAGE',
    startDate: null,
    endDate: null,
    parent1Id: memberId('mbr_moussa'),
    parent2Id: memberId('mbr_awa'),
    children: [],
    ...overrides,
  })
}
