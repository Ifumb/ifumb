import { DomainError } from '@/core/shared/errors/domain-error'
import type { Email } from '@/core/shared/value-objects/email'
import type { UserId } from '@/core/shared/value-objects/user-id'

export type PasswordReset = {
  readonly token: string
  readonly expiresAt: Date
}

export type UserProps = {
  readonly id: UserId
  readonly email: Email
  readonly passwordHash: string
  readonly firstName: string
  readonly lastName: string
  readonly avatarUrl: string | null
  readonly passwordReset: PasswordReset | null
  readonly createdAt: Date
}

export class User {
  private constructor(private readonly props: UserProps) {
    Object.freeze(this)
  }

  static create(props: UserProps): User {
    return new User({
      ...props,
      firstName: requireName(props.firstName, 'firstName'),
      lastName: requireName(props.lastName, 'lastName'),
    })
  }

  get id(): UserId {
    return this.props.id
  }

  get email(): Email {
    return this.props.email
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get firstName(): string {
    return this.props.firstName
  }

  get lastName(): string {
    return this.props.lastName
  }

  get displayName(): string {
    return `${this.props.firstName} ${this.props.lastName}`
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl
  }

  get passwordReset(): PasswordReset | null {
    return this.props.passwordReset
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  withPasswordHash(passwordHash: string): User {
    return new User({ ...this.props, passwordHash })
  }

  withPasswordReset(token: string, expiresAt: Date): User {
    return new User({ ...this.props, passwordReset: { token, expiresAt } })
  }

  clearPasswordReset(): User {
    return new User({ ...this.props, passwordReset: null })
  }

  /** The reset stays usable up to and including its expiry instant, as in the legacy app. */
  hasValidPasswordReset(token: string, now: Date): boolean {
    const pending = this.props.passwordReset
    return pending !== null && pending.token === token && now <= pending.expiresAt
  }
}

function requireName(value: string, field: 'firstName' | 'lastName'): string {
  const trimmed = value.trim()
  if (trimmed === '') {
    throw new DomainError(`User.${field} cannot be blank`, { field })
  }
  return trimmed
}
