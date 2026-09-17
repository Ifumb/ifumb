import type { Member } from '@/core/entities/member'

export type SuggestionConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

/** What the matching algorithm ever looks at — reduced deliberately, never a whole `Member`. */
export type MatchableMember = {
  readonly treeId: string
  readonly memberId: string
  readonly firstName: string
  readonly lastName: string | null
  readonly birthYear: number | null
  readonly culturalTokens: readonly string[]
}

const MAX_BIRTH_YEAR_GAP = 5

/**
 * Whether two members from different trees might be the same person, carried over from the legacy
 * `scoreMatch`: an exact last name is required at all; a birth year gap over 5 years (when both are
 * known) disqualifies; an exact first name plus a shared cultural token or an exact birth year is
 * `HIGH`, an exact first name alone is `MEDIUM`, a first name that is a substring of the other's is
 * `LOW`. Pure and side-effect free — the candidate pool and the "different tree" exclusion are the
 * caller's concern, not this comparison's.
 */
export function matchConfidence(a: MatchableMember, b: MatchableMember): SuggestionConfidence | null {
  if (!sameLastName(a.lastName, b.lastName)) return null
  if (!compatibleBirthYears(a.birthYear, b.birthYear)) return null

  if (sameText(a.firstName, b.firstName)) {
    const strengthened = sharesCulturalToken(a.culturalTokens, b.culturalTokens) || sameBirthYear(a, b)
    return strengthened ? 'HIGH' : 'MEDIUM'
  }
  if (fuzzyFirstName(a.firstName, b.firstName)) return 'LOW'
  return null
}

function sameLastName(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && sameText(a, b)
}

function compatibleBirthYears(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return true
  return Math.abs(a - b) <= MAX_BIRTH_YEAR_GAP
}

function sameBirthYear(a: MatchableMember, b: MatchableMember): boolean {
  return a.birthYear !== null && a.birthYear === b.birthYear
}

function sharesCulturalToken(a: readonly string[], b: readonly string[]): boolean {
  const normalizedB = new Set(b.map(normalize))
  return a.some((token) => normalizedB.has(normalize(token)))
}

function fuzzyFirstName(a: string, b: string): boolean {
  const [na, nb] = [normalize(a), normalize(b)]
  return na !== '' && nb !== '' && (na.includes(nb) || nb.includes(na))
}

function sameText(a: string, b: string): boolean {
  return normalize(a) === normalize(b)
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

/** A tree's own member, reduced to what the matching algorithm ever looks at. */
export function toMatchableMember(treeId: string, member: Member): MatchableMember {
  return {
    treeId,
    memberId: member.id.value,
    firstName: member.firstName,
    lastName: member.lastName,
    birthYear: member.details.birthDate?.year ?? null,
    culturalTokens: [...member.tribes, ...member.ethnicities],
  }
}
