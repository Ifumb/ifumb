import { beforeEach, describe, expect, it } from 'vitest'
import { UserId } from '@/core/shared/value-objects/user-id'
import { ResetPasswordUseCase } from '@/core/use-cases/reset-password'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { FakePasswordHasher, FixedClock } from '@tests/support/fakes'
import { aUser } from '@tests/support/user-fixtures'

const EXPIRES_AT = new Date('2026-03-01T11:00:00Z')
const BEFORE_EXPIRY = new Date('2026-03-01T10:30:00Z')
const AFTER_EXPIRY = new Date(EXPIRES_AT.getTime() + 1)
const INVALID_RESET_TOKEN = { ok: false, error: { kind: 'INVALID_RESET_TOKEN' } }

function resetPasswordAt(users: InMemoryUserRepository, instant: Date): ResetPasswordUseCase {
  return new ResetPasswordUseCase({
    users,
    hasher: new FakePasswordHasher(),
    clock: new FixedClock(instant),
  })
}

describe('ResetPasswordUseCase', () => {
  let users: InMemoryUserRepository

  beforeEach(() => {
    users = new InMemoryUserRepository()
    users.seed(aUser().withPasswordReset('token-1', EXPIRES_AT))
  })

  it('sets the new password hash and clears the used token', async () => {
    await resetPasswordAt(users, BEFORE_EXPIRY).execute({
      token: 'token-1',
      newPassword: 'brand-new-pass',
    })

    const stored = await users.findById(UserId.fromString('usr_alice'))
    expect([stored?.passwordHash, stored?.passwordReset]).toEqual(['hashed:brand-new-pass', null])
  })

  it('fails with INVALID_RESET_TOKEN for an unknown token', async () => {
    const result = await resetPasswordAt(users, BEFORE_EXPIRY).execute({
      token: 'forged-token',
      newPassword: 'brand-new-pass',
    })

    expect(result).toEqual(INVALID_RESET_TOKEN)
  })

  it('fails with INVALID_RESET_TOKEN once the token has expired', async () => {
    const result = await resetPasswordAt(users, AFTER_EXPIRY).execute({
      token: 'token-1',
      newPassword: 'brand-new-pass',
    })

    expect(result).toEqual(INVALID_RESET_TOKEN)
  })

  it('refuses a token that has already been used', async () => {
    const resetPassword = resetPasswordAt(users, BEFORE_EXPIRY)
    await resetPassword.execute({ token: 'token-1', newPassword: 'brand-new-pass' })

    const secondAttempt = await resetPassword.execute({
      token: 'token-1',
      newPassword: 'other-pass',
    })

    expect(secondAttempt).toEqual(INVALID_RESET_TOKEN)
  })
})
