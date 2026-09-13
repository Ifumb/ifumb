import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import { Email } from '@/core/shared/value-objects/email'
import type { PasswordHasher } from '@/core/use-cases/ports/password-hasher'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'
import { toUserProfile, type UserProfile } from '@/core/use-cases/user-profile'

export type AuthenticateUserInput = {
  readonly email: string
  readonly password: string
}

/** A single kind on purpose: callers must not learn whether the email exists. */
export type AuthenticateUserError = { readonly kind: 'INVALID_CREDENTIALS' }

type AuthenticateUserDeps = {
  readonly users: UserRepository
  readonly hasher: PasswordHasher
}

const INVALID_CREDENTIALS: AuthenticateUserError = { kind: 'INVALID_CREDENTIALS' }

export class AuthenticateUserUseCase {
  constructor(private readonly deps: AuthenticateUserDeps) {}

  async execute(input: AuthenticateUserInput): Promise<Result<UserProfile, AuthenticateUserError>> {
    const email = Email.parse(input.email)
    if (!email.ok) return err(INVALID_CREDENTIALS)

    const user = await this.deps.users.findByEmail(email.value)
    if (!user || !(await this.deps.hasher.matches(input.password, user.passwordHash))) {
      return err(INVALID_CREDENTIALS)
    }
    return ok(toUserProfile(user))
  }
}
