import { beforeEach, describe, expect, it } from 'vitest'
import { GetDeathDirectiveUseCase } from '@/core/use-cases/get-death-directive'
import { InMemoryUserRepository } from '@/infrastructure/persistence/in-memory/in-memory-user-repository'
import { aUser } from '@tests/support/user-fixtures'

describe('GetDeathDirectiveUseCase', () => {
  let users: InMemoryUserRepository
  let getDeathDirective: GetDeathDirectiveUseCase

  beforeEach(() => {
    users = new InMemoryUserRepository()
    getDeathDirective = new GetDeathDirectiveUseCase({ users })
  })

  it('returns the stored directive', async () => {
    users.seed(aUser().withDeathDirective('Gardez mon arbre accessible.'))

    expect(await getDeathDirective.execute('usr_alice')).toBe('Gardez mon arbre accessible.')
  })

  it('returns null when none was set', async () => {
    users.seed(aUser())

    expect(await getDeathDirective.execute('usr_alice')).toBeNull()
  })

  it('returns null when the account no longer exists', async () => {
    expect(await getDeathDirective.execute('usr_ghost')).toBeNull()
  })
})
