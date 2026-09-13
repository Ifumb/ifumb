import 'server-only'
import { compare, hash } from 'bcryptjs'
import type { PasswordHasher } from '@/core/use-cases/ports/password-hasher'

/** Same cost as the legacy API, so existing `$2b$12$` hashes keep verifying. */
const BCRYPT_COST = 12

export class BcryptjsPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, BCRYPT_COST)
  }

  async matches(plainPassword: string, passwordHash: string): Promise<boolean> {
    return compare(plainPassword, passwordHash)
  }
}
