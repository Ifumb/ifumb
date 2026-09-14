import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/shared/errors/domain-error'
import { aMember } from '@tests/support/family-fixtures'

describe('Member entity', () => {
  it('rejects a blank first name', () => {
    expect(() => aMember({ firstName: ' ' })).toThrow(DomainError)
  })

  it('builds the full name from the first and last names', () => {
    expect(aMember({ firstName: ' Awa ', lastName: 'Diallo' }).fullName).toBe('Awa Diallo')
  })

  it('uses the first name alone when the last name is unknown', () => {
    expect(aMember({ lastName: null }).fullName).toBe('Awa')
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(aMember())).toBe(true)
  })
})
