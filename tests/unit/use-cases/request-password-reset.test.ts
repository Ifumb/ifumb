import { beforeEach, describe, expect, it } from 'vitest'
import { RequestPasswordResetUseCase } from '@/core/use-cases/request-password-reset'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import {
  FixedClock,
  RecordingPasswordResetMailer,
  SequentialTokenGenerator,
} from '@tests/support/fakes'
import { aUser, emailOf } from '@tests/support/user-fixtures'

const NOW = new Date('2026-03-01T10:00:00Z')
const ONE_HOUR_LATER = new Date('2026-03-01T11:00:00Z')

describe('RequestPasswordResetUseCase', () => {
  let users: InMemoryUserRepository
  let mailer: RecordingPasswordResetMailer
  let requestPasswordReset: RequestPasswordResetUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    mailer = new RecordingPasswordResetMailer()
    requestPasswordReset = new RequestPasswordResetUseCase({
      users,
      tokens: new SequentialTokenGenerator(),
      mailer,
      clock: new FixedClock(NOW),
    })
  })

  it('stores a token valid for one hour and emails it to the account owner', async () => {
    users.seed(aUser())

    await requestPasswordReset.execute({ email: 'alice@example.com' })

    const stored = await users.findByEmail(emailOf('alice@example.com'))
    expect([stored?.passwordReset, mailer.sent]).toEqual([
      { token: 'token-1', expiresAt: ONE_HOUR_LATER },
      [{ to: emailOf('alice@example.com'), token: 'token-1' }],
    ])
  })

  it('succeeds without sending anything for an unknown address', async () => {
    const result = await requestPasswordReset.execute({ email: 'nobody@example.com' })

    expect([result.ok, mailer.sent]).toEqual([true, []])
  })

  it('succeeds without sending anything for a malformed address', async () => {
    const result = await requestPasswordReset.execute({ email: 'not-an-email' })

    expect([result.ok, mailer.sent]).toEqual([true, []])
  })

  it('replaces a previously pending token', async () => {
    users.seed(aUser().withPasswordReset('old-token', ONE_HOUR_LATER))

    await requestPasswordReset.execute({ email: 'alice@example.com' })

    const stored = await users.findByEmail(emailOf('alice@example.com'))
    expect(stored?.hasValidPasswordReset('old-token', NOW)).toBe(false)
  })
})
