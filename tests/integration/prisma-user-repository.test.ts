import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { UserId } from '@/core/shared/value-objects/user-id'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { PrismaUserRepository } from '@/infrastructure/persistence/prisma/prisma-user-repository'
import { TEST_DATABASE_URL } from '@tests/support/test-database'
import { aUser, emailOf } from '@tests/support/user-fixtures'

const prisma = new PrismaClient({ adapter: new PrismaPg(TEST_DATABASE_URL) })
const repository = new PrismaUserRepository(prisma)
const EXPIRES_AT = new Date('2026-03-01T11:00:00Z')

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaUserRepository', () => {
  it('round-trips every field of a new user', async () => {
    const user = aUser({ avatarUrl: 'https://example.com/alice.png' })

    await repository.save(user)
    const stored = await repository.findById(user.id)

    expect(stored).toEqual(user)
  })

  it('finds a user by email as typed', async () => {
    await repository.save(aUser({ email: emailOf('Alice@Example.com') }))

    const stored = await repository.findByEmail(emailOf('Alice@Example.com'))

    expect(stored?.id.value).toBe('usr_alice')
  })

  it('maps the reset token and its expiry to the legacy columns and back', async () => {
    await repository.save(aUser().withPasswordReset('token-1', EXPIRES_AT))

    const stored = await repository.findByPasswordResetToken('token-1')

    expect(stored?.passwordReset).toEqual({ token: 'token-1', expiresAt: EXPIRES_AT })
  })

  it('updates the stored user when saved again with the same id', async () => {
    const user = aUser().withPasswordReset('token-1', EXPIRES_AT)
    await repository.save(user)

    await repository.save(user.withPasswordHash('hashed:changed').clearPasswordReset())

    const stored = await repository.findById(UserId.fromString('usr_alice'))
    expect([stored?.passwordHash, stored?.passwordReset]).toEqual(['hashed:changed', null])
  })

  it('returns null when nothing matches', async () => {
    const stored = await repository.findByPasswordResetToken('unknown-token')

    expect(stored).toBeNull()
  })
})
