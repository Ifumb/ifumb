import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/shared/errors/domain-error'
import { MemberId } from '@/core/shared/value-objects/member-id'

describe('MemberId', () => {
  it('keeps the given identifier', () => {
    expect(MemberId.fromString('mbr_01').value).toBe('mbr_01')
  })

  it('rejects a blank identifier', () => {
    expect(() => MemberId.fromString('')).toThrow(DomainError)
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(MemberId.fromString('mbr_01'))).toBe(true)
  })
})
