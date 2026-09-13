import 'server-only'
import type { User } from '@/core/entities/user'
import type { Email } from '@/core/shared/value-objects/email'
import type { UserId } from '@/core/shared/value-objects/user-id'

/** Persistence of the User aggregate. Returns domain entities, never ORM types. */
export interface UserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  findByPasswordResetToken(token: string): Promise<User | null>
  /** Inserts the user, or replaces the stored one with the same id. */
  save(user: User): Promise<void>
}
