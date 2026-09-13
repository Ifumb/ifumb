import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { PasswordHasher } from '@/core/use-cases/ports/password-hasher'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

export type ChangePasswordInput = {
  readonly userId: string
  readonly currentPassword: string
  readonly newPassword: string
}

export type ChangePasswordError =
  { readonly kind: 'USER_NOT_FOUND' } | { readonly kind: 'WRONG_CURRENT_PASSWORD' }

type ChangePasswordDeps = {
  readonly users: UserRepository
  readonly hasher: PasswordHasher
}

export class ChangePasswordUseCase {
  constructor(private readonly deps: ChangePasswordDeps) {}

  async execute(input: ChangePasswordInput): Promise<Result<void, ChangePasswordError>> {
    const user = await this.deps.users.findById(UserId.fromString(input.userId))
    if (!user) return err({ kind: 'USER_NOT_FOUND' })

    if (!(await this.deps.hasher.matches(input.currentPassword, user.passwordHash))) {
      return err({ kind: 'WRONG_CURRENT_PASSWORD' })
    }
    const passwordHash = await this.deps.hasher.hash(input.newPassword)
    await this.deps.users.save(user.withPasswordHash(passwordHash))
    return ok(undefined)
  }
}
