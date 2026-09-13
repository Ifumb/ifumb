import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/shared/errors/domain-error'
import { aUser } from '@tests/support/user-fixtures'

const EXPIRES_AT = new Date('2026-03-01T12:00:00Z')
const ONE_MS = 1

describe('User entity', () => {
  it('stores trimmed first and last names', () => {
    const user = aUser({ firstName: '  Alice ', lastName: ' Martin  ' })

    expect(user.displayName).toBe('Alice Martin')
  })

  it('rejects a blank first name', () => {
    expect(() => aUser({ firstName: '   ' })).toThrow(DomainError)
  })

  it('rejects a blank last name', () => {
    expect(() => aUser({ lastName: '' })).toThrow(DomainError)
  })

  it('returns a new instance with the new password hash and leaves the original intact', () => {
    const user = aUser({ passwordHash: 'hashed:old' })

    const updated = user.withPasswordHash('hashed:new')

    expect([user.passwordHash, updated.passwordHash]).toEqual(['hashed:old', 'hashed:new'])
  })

  it('accepts its pending reset token until the expiry instant', () => {
    const user = aUser().withPasswordReset('token-1', EXPIRES_AT)

    expect(user.hasValidPasswordReset('token-1', EXPIRES_AT)).toBe(true)
  })

  it('refuses its reset token once expired', () => {
    const user = aUser().withPasswordReset('token-1', EXPIRES_AT)
    const justAfterExpiry = new Date(EXPIRES_AT.getTime() + ONE_MS)

    expect(user.hasValidPasswordReset('token-1', justAfterExpiry)).toBe(false)
  })

  it('refuses a token that is not the pending one', () => {
    const user = aUser().withPasswordReset('token-1', EXPIRES_AT)

    expect(user.hasValidPasswordReset('token-2', EXPIRES_AT)).toBe(false)
  })

  it('refuses any token when no reset is pending', () => {
    expect(aUser().hasValidPasswordReset('token-1', EXPIRES_AT)).toBe(false)
  })

  it('clears the pending reset token and its expiry', () => {
    const user = aUser().withPasswordReset('token-1', EXPIRES_AT).clearPasswordReset()

    expect(user.passwordReset).toBeNull()
  })
})
