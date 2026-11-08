import { beforeEach, describe, expect, it } from 'vitest'
import { DEATH_DIRECTIVE_MAX_LENGTH } from '@/core/entities/user'
import { UserId } from '@/core/shared/value-objects/user-id'
import { UpdateDeathDirectiveUseCase } from '@/core/use-cases/update-death-directive'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { aUser } from '@tests/support/user-fixtures'

const ALICE_ID = UserId.fromString('usr_alice')

describe('UpdateDeathDirectiveUseCase', () => {
  let users: InMemoryUserRepository
  let updateDeathDirective: UpdateDeathDirectiveUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    users.seed(aUser())
    updateDeathDirective = new UpdateDeathDirectiveUseCase({ users })
  })

  it('stores the new directive', async () => {
    const result = await updateDeathDirective.execute({
      userId: 'usr_alice',
      directive: 'Gardez mon arbre accessible.',
    })

    const stored = await users.findById(ALICE_ID)
    expect([result.ok, stored?.deathDirective]).toEqual([true, 'Gardez mon arbre accessible.'])
  })

  it('clears the directive when given null', async () => {
    await updateDeathDirective.execute({ userId: 'usr_alice', directive: 'A message' })

    const result = await updateDeathDirective.execute({ userId: 'usr_alice', directive: null })

    const stored = await users.findById(ALICE_ID)
    expect([result.ok, stored?.deathDirective]).toEqual([true, null])
  })

  it('fails with USER_NOT_FOUND when the account no longer exists', async () => {
    const result = await updateDeathDirective.execute({ userId: 'usr_ghost', directive: 'x' })

    expect(result).toEqual({ ok: false, error: { kind: 'USER_NOT_FOUND' } })
  })

  it('fails with DIRECTIVE_TOO_LONG and leaves the stored directive untouched', async () => {
    const tooLong = 'a'.repeat(DEATH_DIRECTIVE_MAX_LENGTH + 1)

    const result = await updateDeathDirective.execute({ userId: 'usr_alice', directive: tooLong })

    const stored = await users.findById(ALICE_ID)
    expect([result, stored?.deathDirective]).toEqual([
      { ok: false, error: { kind: 'DIRECTIVE_TOO_LONG' } },
      null,
    ])
  })
})
