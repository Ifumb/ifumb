import type { MemberDetailsInput } from '@/core/entities/member'
import { dateOf } from '@tests/support/family-fixtures'

/** Details as a valid member form would send them. */
export function memberInput(overrides: Partial<MemberDetailsInput> = {}): MemberDetailsInput {
  return {
    firstName: 'Awa',
    lastName: 'Diallo',
    nickname: null,
    gender: 'FEMALE',
    birthDate: dateOf('1932-05'),
    birthDateApprox: false,
    deathDate: null,
    birthPlace: null,
    tribe: 'Peul',
    clan: null,
    ethnicity: null,
    originRegion: null,
    biography: null,
    certainty: 'CONFIRMED',
    ...overrides,
  }
}
