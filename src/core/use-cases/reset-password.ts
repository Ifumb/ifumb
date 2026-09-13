import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { PasswordHasher } from '@/core/use-cases/ports/password-hasher'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

export type ResetPasswordInput = {
  readonly token: string
  readonly newPassword: string
}

export type ResetPasswordError = { readonly kind: 'INVALID_RESET_TOKEN' }

type ResetPasswordDeps = {
  readonly users: UserRepository
  readonly hasher: PasswordHasher
  readonly clock: Clock
}

export class ResetPasswordUseCase {
  constructor(private readonly deps: ResetPasswordDeps) {}

  async execute(input: ResetPasswordInput): Promise<Result<void, ResetPasswordError>> {
    const user = await this.deps.users.findByPasswordResetToken(input.token)
    if (!user?.hasValidPasswordReset(input.token, this.deps.clock.now())) {
      return err({ kind: 'INVALID_RESET_TOKEN' })
    }
    const passwordHash = await this.deps.hasher.hash(input.newPassword)
    await this.deps.users.save(user.withPasswordHash(passwordHash).clearPasswordReset())
    return ok(undefined)
  }
}
