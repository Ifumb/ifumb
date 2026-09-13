import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/shared/errors/domain-error'
import { UserId } from '@/core/shared/value-objects/user-id'

describe('UserId', () => {
  it('keeps the given identifier', () => {
    expect(UserId.fromString('usr_01').value).toBe('usr_01')
  })

  it('rejects a blank identifier', () => {
    expect(() => UserId.fromString('   ')).toThrow(DomainError)
  })

  it('cannot be mutated', () => {
    const id = UserId.fromString('usr_01')

    expect(Object.isFrozen(id)).toBe(true)
  })
})
