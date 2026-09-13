import 'server-only'
import { User } from '@/core/entities/user'
import { DomainError } from '@/core/shared/errors/domain-error'
import { Email } from '@/core/shared/value-objects/email'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { User as UserRow } from '@/infrastructure/persistence/prisma/generated/client'

export type UserWriteData = Omit<UserRow, 'updatedAt'>

export function toDomainUser(row: UserRow): User {
  return User.create({
    id: UserId.fromString(row.id),
    email: toEmail(row),
    passwordHash: row.passwordHash,
    firstName: row.firstName,
    lastName: row.lastName,
    avatarUrl: row.avatarUrl,
    passwordReset:
      row.resetToken && row.resetTokenExpiry
        ? { token: row.resetToken, expiresAt: row.resetTokenExpiry }
        : null,
    createdAt: row.createdAt,
  })
}

export function toUserWriteData(user: User): UserWriteData {
  return {
    id: user.id.value,
    email: user.email.value,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    resetToken: user.passwordReset?.token ?? null,
    resetTokenExpiry: user.passwordReset?.expiresAt ?? null,
    createdAt: user.createdAt,
  }
}

function toEmail(row: UserRow): Email {
  const email = Email.parse(row.email)
  if (!email.ok) {
    throw new DomainError('Stored user email is malformed', { userId: row.id })
  }
  return email.value
}
