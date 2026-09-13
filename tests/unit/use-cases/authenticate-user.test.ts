import { beforeEach, describe, expect, it } from 'vitest'
import { AuthenticateUserUseCase } from '@/core/use-cases/authenticate-user'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { FakePasswordHasher } from '@tests/support/fakes'
import { ALICE_PASSWORD, aUser } from '@tests/support/user-fixtures'

const INVALID_CREDENTIALS = { ok: false, error: { kind: 'INVALID_CREDENTIALS' } }

describe('AuthenticateUserUseCase', () => {
  let authenticateUser: AuthenticateUserUseCase

  beforeEach(() => {
    const users = new InMemoryUserRepository()
    users.seed(aUser())
    authenticateUser = new AuthenticateUserUseCase({ users, hasher: new FakePasswordHasher() })
  })

  it('returns the profile when the email and password match', async () => {
    const result = await authenticateUser.execute({
      email: 'alice@example.com',
      password: ALICE_PASSWORD,
    })

    expect(result.ok && result.value.id).toBe('usr_alice')
  })

  it('fails with INVALID_CREDENTIALS for an unknown email', async () => {
    const result = await authenticateUser.execute({
      email: 'nobody@example.com',
      password: ALICE_PASSWORD,
    })

    expect(result).toEqual(INVALID_CREDENTIALS)
  })

  it('fails with the same INVALID_CREDENTIALS for a wrong password, revealing nothing', async () => {
    const result = await authenticateUser.execute({
      email: 'alice@example.com',
      password: 'wrong-password',
    })

    expect(result).toEqual(INVALID_CREDENTIALS)
  })

  it('fails with INVALID_CREDENTIALS for a malformed email', async () => {
    const result = await authenticateUser.execute({ email: 'alice', password: ALICE_PASSWORD })

    expect(result).toEqual(INVALID_CREDENTIALS)
  })
})
