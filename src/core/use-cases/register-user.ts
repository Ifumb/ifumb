import 'server-only'
import { User, type UserProps } from '@/core/entities/user'
import { DomainError } from '@/core/shared/errors/domain-error'
import { err, ok, type Result } from '@/core/shared/result'
import { Email } from '@/core/shared/value-objects/email'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PasswordHasher } from '@/core/use-cases/ports/password-hasher'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'
import { toUserProfile, type UserProfile } from '@/core/use-cases/user-profile'

export type RegisterUserInput = {
  readonly email: string
  readonly password: string
  readonly firstName: string
  readonly lastName: string
}

export type RegisterUserError =
  | { readonly kind: 'EMAIL_ALREADY_USED' }
  | { readonly kind: 'INVALID_EMAIL' }
  | { readonly kind: 'INVALID_NAME' }

type RegisterUserDeps = {
  readonly users: UserRepository
  readonly hasher: PasswordHasher
  readonly ids: IdGenerator
  readonly clock: Clock
}

type NewUserDraft = RegisterUserInput & { readonly verifiedEmail: Email }

export class RegisterUserUseCase {
  constructor(private readonly deps: RegisterUserDeps) {}

  async execute(input: RegisterUserInput): Promise<Result<UserProfile, RegisterUserError>> {
    const email = Email.parse(input.email)
    if (!email.ok) return email
    if (await this.deps.users.findByEmail(email.value)) {
      return err({ kind: 'EMAIL_ALREADY_USED' })
    }
    const user = await this.buildUser({ ...input, verifiedEmail: email.value })
    if (!user.ok) return user
    await this.deps.users.save(user.value)
    return ok(toUserProfile(user.value))
  }

  private async buildUser(draft: NewUserDraft): Promise<Result<User, RegisterUserError>> {
    const props = this.newUserProps(draft, await this.deps.hasher.hash(draft.password))
    try {
      return ok(User.create(props))
    } catch (error) {
      if (error instanceof DomainError) return err({ kind: 'INVALID_NAME' })
      throw error
    }
  }

  private newUserProps(draft: NewUserDraft, passwordHash: string): UserProps {
    return {
      id: UserId.fromString(this.deps.ids.next()),
      email: draft.verifiedEmail,
      passwordHash,
      firstName: draft.firstName,
      lastName: draft.lastName,
      avatarUrl: null,
      passwordReset: null,
      createdAt: this.deps.clock.now(),
    }
  }
}
