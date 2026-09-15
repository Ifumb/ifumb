import type { AuditValue } from '@/core/entities/audit-change'
import { culturalTokens } from '@/core/entities/cultural-tokens'
import { DomainError } from '@/core/shared/errors/domain-error'
import type { MemberId } from '@/core/shared/value-objects/member-id'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'
export type Certainty = 'CONFIRMED' | 'APPROXIMATE' | 'UNKNOWN'

/** What a form may change on a member; text fields arrive raw and are trimmed here. */
export type MemberDetailsInput = {
  readonly firstName: string
  readonly lastName: string | null
  readonly nickname: string | null
  readonly gender: Gender | null
  readonly birthDate: PartialDate | null
  readonly birthDateApprox: boolean
  readonly deathDate: PartialDate | null
  readonly birthPlace: string | null
  readonly tribe: string | null
  readonly clan: string | null
  readonly ethnicity: string | null
  readonly originRegion: string | null
  readonly biography: string | null
  readonly certainty: Certainty
}

export type MemberProps = MemberDetailsInput & {
  readonly id: MemberId
  readonly photoUrl: string | null
  /** The account that said "this is me", if any. */
  readonly claimedById: string | null
}

/** Every recorded fact of a member, without who claimed it. */
export type MemberFacts = Omit<MemberProps, 'claimedById'>

export type MemberField = keyof MemberDetailsInput

export type MemberDetailChange = {
  readonly field: MemberField
  readonly before: AuditValue
  readonly after: AuditValue
}

/** Longest value of each text field, carried over from the legacy API. */
export const MEMBER_TEXT_LIMITS = {
  firstName: 100,
  lastName: 100,
  nickname: 100,
  birthPlace: 200,
  tribe: 150,
  clan: 150,
  ethnicity: 150,
  originRegion: 150,
  biography: 10_000,
} as const satisfies Partial<Record<MemberField, number>>

const TEXT_FIELDS: readonly (keyof typeof MEMBER_TEXT_LIMITS)[] = [
  'firstName',
  'lastName',
  'nickname',
  'birthPlace',
  'tribe',
  'clan',
  'ethnicity',
  'originRegion',
  'biography',
]

export const MEMBER_FIELDS: readonly MemberField[] = [
  'firstName',
  'lastName',
  'nickname',
  'gender',
  'birthDate',
  'birthDateApprox',
  'deathDate',
  'birthPlace',
  'tribe',
  'clan',
  'ethnicity',
  'originRegion',
  'biography',
  'certainty',
]

/**
 * A person in a family tree. Only the first name is required: incomplete genealogical records are
 * expected, and every other fact may be unknown.
 */
export class Member {
  private readonly props: MemberFacts
  /** The account that said "this is me", kept apart from the facts shown to readers. */
  readonly claimedById: string | null

  private constructor({ claimedById, ...props }: MemberProps) {
    this.props = props
    this.claimedById = claimedById
    Object.freeze(this)
  }

  /** A member as stored, possibly by the legacy app: only the first name is checked. */
  static create(props: MemberProps): Member {
    const firstName = props.firstName.trim()
    if (firstName === '') {
      throw new DomainError('Member.firstName cannot be blank', { memberId: props.id.value })
    }
    return new Member({ ...props, firstName })
  }

  /** A new member, with every limit of a written member enforced. */
  static start({ id, ...input }: MemberDetailsInput & { readonly id: MemberId }): Member {
    return new Member({ ...validDetails(input, id), id, photoUrl: null, claimedById: null })
  }

  /** The member with new details and the fields that actually changed; itself when none did. */
  revise(input: MemberDetailsInput): { member: Member; changes: MemberDetailChange[] } {
    const details = validDetails(input, this.props.id)
    const next = new Member({ ...this.props, ...details, claimedById: this.claimedById })
    const [before, after] = [this.recordedValues, next.recordedValues]
    const changes = MEMBER_FIELDS.flatMap((field) =>
      before[field] === after[field] ? [] : [{ field, before: before[field], after: after[field] }],
    )
    return { member: changes.length === 0 ? this : next, changes }
  }

  /** The member with another photo, or none, and whether it changed; itself when it did not. */
  withPhoto(photoUrl: string | null): { member: Member; changed: boolean } {
    if (photoUrl === this.props.photoUrl) return { member: this, changed: false }
    return {
      member: new Member({ ...this.props, photoUrl, claimedById: this.claimedById }),
      changed: true,
    }
  }

  /** Every recorded fact, read-only. */
  get details(): MemberFacts {
    return this.props
  }

  /** Each editable field as the history records it: dates as their stored text. */
  get recordedValues(): Readonly<Record<MemberField, AuditValue>> {
    const values = MEMBER_FIELDS.map((field) => {
      const value = this.props[field]
      return [field, typeof value === 'object' && value !== null ? value.toString() : value]
    })
    return Object.fromEntries(values)
  }

  get id(): MemberId {
    return this.props.id
  }

  get firstName(): string {
    return this.props.firstName
  }

  get lastName(): string | null {
    return this.props.lastName
  }

  get fullName(): string {
    return [this.props.firstName, this.props.lastName].filter(Boolean).join(' ')
  }

  /** Tribes, recorded by the legacy app as one comma-separated text. */
  get tribes(): readonly string[] {
    return culturalTokens(this.props.tribe)
  }

  /** Ethnicities, recorded by the legacy app as one comma-separated text. */
  get ethnicities(): readonly string[] {
    return culturalTokens(this.props.ethnicity)
  }

  /** The fields a tree search looks into. */
  get searchableTexts(): readonly string[] {
    const { firstName, lastName, tribe, ethnicity, clan } = this.props
    return [firstName, lastName, tribe, ethnicity, clan].filter((text): text is string => !!text)
  }
}

function validDetails(input: MemberDetailsInput, id: MemberId): MemberDetailsInput {
  const trimmed = Object.fromEntries(
    TEXT_FIELDS.map((field) => [field, input[field]?.trim() || null]),
  )
  const details = { ...input, ...trimmed, firstName: input.firstName.trim() }
  if (details.firstName === '') {
    throw new DomainError('Member.firstName cannot be blank', { memberId: id.value })
  }
  const tooLong = TEXT_FIELDS.find(
    (field) => (details[field]?.length ?? 0) > MEMBER_TEXT_LIMITS[field],
  )
  if (tooLong) throw new DomainError(`Member.${tooLong} is too long`, { memberId: id.value })
  return details
}
