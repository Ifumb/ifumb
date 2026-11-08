import 'server-only'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

type GetDeathDirectiveDeps = { readonly users: UserRepository }

/** What the account holder, if any, wished for their owned trees after their death. */
export class GetDeathDirectiveUseCase {
  constructor(private readonly deps: GetDeathDirectiveDeps) {}

  async execute(userId: string): Promise<string | null> {
    const user = await this.deps.users.findById(UserId.fromString(userId))
    return user?.deathDirective ?? null
  }
}
