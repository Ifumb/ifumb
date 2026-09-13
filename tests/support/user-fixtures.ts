import { User, type UserProps } from '@/core/entities/user'
import { Email } from '@/core/shared/value-objects/email'
import { UserId } from '@/core/shared/value-objects/user-id'

export const ALICE_PASSWORD = 'correct-password'

export function emailOf(raw: string): Email {
  const parsed = Email.parse(raw)
  if (!parsed.ok) throw new Error(`Invalid email in test fixture: ${raw}`)
  return parsed.value
}

export function aUser(overrides: Partial<UserProps> = {}): User {
  return User.create({
    id: UserId.fromString('usr_alice'),
    email: emailOf('alice@example.com'),
    passwordHash: `hashed:${ALICE_PASSWORD}`,
    firstName: 'Alice',
    lastName: 'Martin',
    avatarUrl: null,
    passwordReset: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  })
}
