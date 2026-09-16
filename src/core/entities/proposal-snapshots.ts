import type { AuditDiff, AuditSnapshot, AuditValue } from '@/core/entities/audit-change'
import type { Certainty, Gender, MemberDetailsInput } from '@/core/entities/member'
import type { Union, UnionType } from '@/core/entities/union'
import { err, ok, type Result } from '@/core/shared/result'
import { PartialDate } from '@/core/shared/value-objects/partial-date'

export type ProposalUnreadable = { readonly kind: 'PROPOSAL_UNREADABLE' }

/** A union's own details as a proposal snapshot represents them: people by raw id. */
export type UnionSnapshotDetails = {
  readonly type: UnionType
  readonly parent1Id: string
  readonly parent2Id: string | null
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
}

/** A member proposed from nothing: every field starts unset, as `Member.start` expects. */
export const BLANK_MEMBER_DETAILS: MemberDetailsInput = {
  firstName: '',
  lastName: null,
  nickname: null,
  gender: null,
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
}

/**
 * A union's own field values, fit to be replayed by an approval later — unlike `union-audit.ts`,
 * which resolves parent names for a human-readable history entry, this keeps the raw ids a
 * proposal needs. Members need no equivalent here: `Member.recordedValues` already holds raw,
 * replayable values, so `memberCreationDiff`/`memberRevisionDiff`/`memberDeletionDiff` from
 * `member-audit.ts` serve proposals and the audit log alike.
 */
export function unionSnapshotValues(union: Union): Readonly<Record<string, AuditValue>> {
  return {
    type: union.type,
    parent1Id: union.parent1Id?.value ?? null,
    parent2Id: union.parent2Id?.value ?? null,
    startDate: union.startDate?.toString() ?? null,
    endDate: union.endDate?.toString() ?? null,
  }
}

const filled = (snapshot: Readonly<Record<string, AuditValue>>): AuditSnapshot =>
  Object.fromEntries(Object.entries(snapshot).filter(([, value]) => value !== null))

export function unionProposalCreationSnapshot(union: Union): AuditDiff {
  return { before: null, after: filled(unionSnapshotValues(union)) }
}

/** reason: only the fields that actually differ are kept, as `memberRevisionDiff` already does. */
export function unionProposalRevisionSnapshot(before: Union, after: Union): AuditDiff {
  const [previous, next] = [unionSnapshotValues(before), unionSnapshotValues(after)]
  const fields = Object.keys(next).filter((field) => previous[field] !== next[field])
  return {
    before: Object.fromEntries(fields.map((field) => [field, previous[field] ?? null])),
    after: Object.fromEntries(fields.map((field) => [field, next[field] ?? null])),
  }
}

export function unionProposalDeletionSnapshot(union: Union): AuditDiff {
  return { before: filled(unionSnapshotValues(union)), after: null }
}

// ── Reading a snapshot back, to apply it (module 2.6b) ──────────────────────────────────────

function pick<T>(snapshot: AuditSnapshot, field: string, base: T, read: (value: AuditValue) => T): T {
  // reason: the `hasOwn` guard already proves the key is present; the cast only silences
  // `noUncheckedIndexedAccess`, which cannot see that.
  return Object.hasOwn(snapshot, field) ? read(snapshot[field] as AuditValue) : base
}

function asText(value: AuditValue): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function asBoolean(value: AuditValue): boolean {
  return value === true
}

function asDate(value: AuditValue): PartialDate | null {
  if (typeof value !== 'string' || value === '') return null
  const parsed = PartialDate.parse(value)
  return parsed.ok ? parsed.value : null
}

function asEnum<T extends string>(value: AuditValue, allowed: ReadonlySet<T>): T | null {
  return typeof value === 'string' && allowed.has(value as T) ? (value as T) : null
}

const GENDERS: ReadonlySet<Gender> = new Set(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'])
const CERTAINTIES: ReadonlySet<Certainty> = new Set(['CONFIRMED', 'APPROXIMATE', 'UNKNOWN'])
const UNION_TYPES: ReadonlySet<UnionType> = new Set(['MARRIAGE', 'PARTNERSHIP', 'BIOLOGICAL'])

/**
 * A member's details, `snapshot`'s fields overlaid onto `current` — a create's snapshot carries
 * every field that was set, so `current` is `BLANK_MEMBER_DETAILS`; a revision's snapshot carries
 * only the fields that changed, so `current` is the member's own recorded details, kept for
 * everything the snapshot leaves unmentioned. `PROPOSAL_UNREADABLE` when no first name results —
 * the one invariant `Member.start` cannot do without.
 */
export function memberDetailsFromSnapshot(
  current: MemberDetailsInput,
  snapshot: AuditSnapshot,
): Result<MemberDetailsInput, ProposalUnreadable> {
  const firstName = pick(snapshot, 'firstName', current.firstName, asText)
  if (!firstName) return err({ kind: 'PROPOSAL_UNREADABLE' })
  return ok({
    firstName,
    lastName: pick(snapshot, 'lastName', current.lastName, asText),
    nickname: pick(snapshot, 'nickname', current.nickname, asText),
    gender: pick(snapshot, 'gender', current.gender, (value) => asEnum(value, GENDERS)),
    birthDate: pick(snapshot, 'birthDate', current.birthDate, asDate),
    birthDateApprox: pick(snapshot, 'birthDateApprox', current.birthDateApprox, asBoolean),
    deathDate: pick(snapshot, 'deathDate', current.deathDate, asDate),
    birthPlace: pick(snapshot, 'birthPlace', current.birthPlace, asText),
    tribe: pick(snapshot, 'tribe', current.tribe, asText),
    clan: pick(snapshot, 'clan', current.clan, asText),
    ethnicity: pick(snapshot, 'ethnicity', current.ethnicity, asText),
    originRegion: pick(snapshot, 'originRegion', current.originRegion, asText),
    biography: pick(snapshot, 'biography', current.biography, asText),
    certainty:
      pick(snapshot, 'certainty', current.certainty, (value) => asEnum(value, CERTAINTIES)) ??
      'CONFIRMED',
  })
}

/** Same overlay as `memberDetailsFromSnapshot`, for a union; unreadable without a first parent. */
export function unionDetailsFromSnapshot(
  current: UnionSnapshotDetails,
  snapshot: AuditSnapshot,
): Result<UnionSnapshotDetails, ProposalUnreadable> {
  const parent1Id = pick(snapshot, 'parent1Id', current.parent1Id, asText)
  if (!parent1Id) return err({ kind: 'PROPOSAL_UNREADABLE' })
  return ok({
    type: pick(snapshot, 'type', current.type, (value) => asEnum(value, UNION_TYPES)) ?? 'BIOLOGICAL',
    parent1Id,
    parent2Id: pick(snapshot, 'parent2Id', current.parent2Id, asText),
    startDate: pick(snapshot, 'startDate', current.startDate, asDate),
    endDate: pick(snapshot, 'endDate', current.endDate, asDate),
  })
}
