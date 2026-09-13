import 'server-only'

/** One-way password hashing. */
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>
  matches(plainPassword: string, passwordHash: string): Promise<boolean>
}
