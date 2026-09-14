import { DomainError } from '@/core/shared/errors/domain-error'
import type { MemberId } from '@/core/shared/value-objects/member-id'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'
export type Certainty = 'CONFIRMED' | 'APPROXIMATE' | 'UNKNOWN'

export type MemberProps = {
  readonly id: MemberId
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

/**
 * A person in a family tree. Only the first name is required: incomplete genealogical records are
 * expected, and every other fact may be unknown.
 */
export class Member {
  private constructor(private readonly props: MemberProps) {
    Object.freeze(this)
  }

  static create(props: MemberProps): Member {
    const firstName = props.firstName.trim()
    if (firstName === '') {
      throw new DomainError('Member.firstName cannot be blank', { memberId: props.id.value })
    }
    return new Member({ ...props, firstName })
  }

  /** Every recorded fact, read-only. */
  get details(): MemberProps {
    return this.props
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

  /** The fields a tree search looks into. */
  get searchableTexts(): readonly string[] {
    const { firstName, lastName, tribe, ethnicity, clan } = this.props
    return [firstName, lastName, tribe, ethnicity, clan].filter((text): text is string => !!text)
  }
}
