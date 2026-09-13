import 'server-only'
import type { User } from '@/core/entities/user'
import type { Email } from '@/core/shared/value-objects/email'
import type { UserId } from '@/core/shared/value-objects/user-id'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

/** Test double of the User repository, substitutable for the Prisma implementation. */
export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>()

  seed(...users: User[]): void {
    for (const user of users) this.usersById.set(user.id.value, user)
  }

  async findById(id: UserId): Promise<User | null> {
    return this.usersById.get(id.value) ?? null
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.findFirst((user) => user.email.value === email.value)
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.findFirst((user) => user.passwordReset?.token === token)
  }

  async save(user: User): Promise<void> {
    this.usersById.set(user.id.value, user)
  }

  private findFirst(matches: (user: User) => boolean): User | null {
    return [...this.usersById.values()].find(matches) ?? null
  }
}
