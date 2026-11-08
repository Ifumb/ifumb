import 'server-only'
import { DomainError } from '@/core/shared/errors/domain-error'
import { err, ok, type Result } from '@/core/shared/result'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

export type UpdateDeathDirectiveInput = {
  readonly userId: string
  readonly directive: string | null
}

export type UpdateDeathDirectiveError =
  | { readonly kind: 'USER_NOT_FOUND' }
  | { readonly kind: 'DIRECTIVE_TOO_LONG' }

type UpdateDeathDirectiveDeps = { readonly users: UserRepository }

/**
 * Lets an account holder say what they wish for their owned trees after their death - purely
 * informative today, nothing acts on it automatically (see docs/legal/legal-register.md).
 */
export class UpdateDeathDirectiveUseCase {
  constructor(private readonly deps: UpdateDeathDirectiveDeps) {}

  async execute(input: UpdateDeathDirectiveInput): Promise<Result<void, UpdateDeathDirectiveError>> {
    const user = await this.deps.users.findById(UserId.fromString(input.userId))
    if (!user) return err({ kind: 'USER_NOT_FOUND' })

    try {
      await this.deps.users.save(user.withDeathDirective(input.directive))
    } catch (error) {
      if (error instanceof DomainError) return err({ kind: 'DIRECTIVE_TOO_LONG' })
      throw error
    }
    return ok(undefined)
  }
}
