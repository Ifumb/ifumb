import 'server-only'
import type { User } from '@/core/entities/user'

/** Public view of an account: safe to hand to the presentation layer (no credentials). */
export type UserProfile = {
  readonly id: string
  readonly email: string
  readonly firstName: string
  readonly lastName: string
  readonly avatarUrl: string | null
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id.value,
    email: user.email.value,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
  }
}
