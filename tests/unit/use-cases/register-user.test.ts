import { beforeEach, describe, expect, it } from 'vitest'
import { RegisterUserUseCase } from '@/core/use-cases/register-user'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { FakePasswordHasher, FixedClock, SequentialIdGenerator } from '@tests/support/fakes'
import { aUser, emailOf } from '@tests/support/user-fixtures'

const NOW = new Date('2026-03-01T10:00:00Z')

const validInput = {
  email: 'bob@example.com',
  password: 'secret-pass',
  firstName: 'Bob',
  lastName: 'Dupont',
}

describe('RegisterUserUseCase', () => {
  let users: InMemoryUserRepository
  let registerUser: RegisterUserUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    registerUser = new RegisterUserUseCase({
      users,
      hasher: new FakePasswordHasher(),
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(NOW),
    })
  })

  it('registers the user and returns a profile without password data', async () => {
    const result = await registerUser.execute(validInput)

    expect(result).toEqual({
      ok: true,
      value: {
        id: 'usr_1',
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Dupont',
        avatarUrl: null,
      },
    })
  })

  it('stores a hash of the password, never the password itself', async () => {
    await registerUser.execute(validInput)

    const stored = await users.findByEmail(emailOf('bob@example.com'))

    expect(stored?.passwordHash).toBe('hashed:secret-pass')
  })

  it('fails with EMAIL_ALREADY_USED when the address belongs to another account', async () => {
    users.seed(aUser({ email: emailOf('bob@example.com') }))

    const result = await registerUser.execute(validInput)

    expect(result).toEqual({ ok: false, error: { kind: 'EMAIL_ALREADY_USED' } })
  })

  it('fails with INVALID_EMAIL for a malformed address', async () => {
    const result = await registerUser.execute({ ...validInput, email: 'bob-at-example' })

    expect(result).toEqual({ ok: false, error: { kind: 'INVALID_EMAIL' } })
  })

  it('fails with INVALID_NAME when a name is blank', async () => {
    const result = await registerUser.execute({ ...validInput, firstName: '  ' })

    expect(result).toEqual({ ok: false, error: { kind: 'INVALID_NAME' } })
  })
})
