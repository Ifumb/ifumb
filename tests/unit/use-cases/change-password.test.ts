import { beforeEach, describe, expect, it } from 'vitest'
import { UserId } from '@/core/shared/value-objects/user-id'
import { ChangePasswordUseCase } from '@/core/use-cases/change-password'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { FakePasswordHasher } from '@tests/support/fakes'
import { ALICE_PASSWORD, aUser } from '@tests/support/user-fixtures'

const ALICE_ID = UserId.fromString('usr_alice')

describe('ChangePasswordUseCase', () => {
  let users: InMemoryUserRepository
  let changePassword: ChangePasswordUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    users.seed(aUser())
    changePassword = new ChangePasswordUseCase({ users, hasher: new FakePasswordHasher() })
  })

  it('replaces the password hash when the current password is correct', async () => {
    const result = await changePassword.execute({
      userId: 'usr_alice',
      currentPassword: ALICE_PASSWORD,
      newPassword: 'brand-new-pass',
    })

    const stored = await users.findById(ALICE_ID)
    expect([result.ok, stored?.passwordHash]).toEqual([true, 'hashed:brand-new-pass'])
  })

  it('fails with USER_NOT_FOUND when the account no longer exists', async () => {
    const result = await changePassword.execute({
      userId: 'usr_ghost',
      currentPassword: ALICE_PASSWORD,
      newPassword: 'brand-new-pass',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'USER_NOT_FOUND' } })
  })

  it('fails with WRONG_CURRENT_PASSWORD and keeps the existing hash', async () => {
    const result = await changePassword.execute({
      userId: 'usr_alice',
      currentPassword: 'not-my-password',
      newPassword: 'brand-new-pass',
    })

    const stored = await users.findById(ALICE_ID)
    expect([result, stored?.passwordHash]).toEqual([
      { ok: false, error: { kind: 'WRONG_CURRENT_PASSWORD' } },
      `hashed:${ALICE_PASSWORD}`,
    ])
  })
})
