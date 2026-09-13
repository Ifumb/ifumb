import 'server-only'
import type { User } from '@/core/entities/user'
import { ok, type Result } from '@/core/shared/result'
import { Email } from '@/core/shared/value-objects/email'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { PasswordResetMailer } from '@/core/use-cases/ports/password-reset-mailer'
import type { TokenGenerator } from '@/core/use-cases/ports/token-generator'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

export type RequestPasswordResetInput = {
  readonly email: string
}

type RequestPasswordResetDeps = {
  readonly users: UserRepository
  readonly tokens: TokenGenerator
  readonly mailer: PasswordResetMailer
  readonly clock: Clock
}

export class RequestPasswordResetUseCase {
  constructor(private readonly deps: RequestPasswordResetDeps) {}

  /**
   * Always succeeds, whether or not the address matches an account,
   * so that the outcome cannot be used to discover registered emails.
   */
  async execute(input: RequestPasswordResetInput): Promise<Result<void, never>> {
    const email = Email.parse(input.email)
    const user = email.ok ? await this.deps.users.findByEmail(email.value) : null
    if (user) await this.issueResetLink(user)
    return ok(undefined)
  }

  private async issueResetLink(user: User): Promise<void> {
    const token = this.deps.tokens.generate()
    const expiresAt = new Date(this.deps.clock.now().getTime() + PASSWORD_RESET_TTL_MS)
    await this.deps.users.save(user.withPasswordReset(token, expiresAt))
    await this.deps.mailer.sendResetLink({ to: user.email, token })
  }
}
