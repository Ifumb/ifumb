import { describe, expect, it } from 'vitest'
import { Email } from '@/core/shared/value-objects/email'

describe('Email', () => {
  it('accepts a well-formed address', () => {
    const result = Email.parse('alice@example.com')

    expect(result.ok && result.value.value).toBe('alice@example.com')
  })

  it('rejects a malformed address', () => {
    const result = Email.parse('alice-at-example.com')

    expect(result).toEqual({ ok: false, error: { kind: 'INVALID_EMAIL' } })
  })

  it('removes surrounding whitespace', () => {
    const result = Email.parse('  alice@example.com  ')

    expect(result.ok && result.value.value).toBe('alice@example.com')
  })

  it('preserves letter case, like the legacy exact-match lookup', () => {
    const result = Email.parse('Alice@Example.com')

    expect(result.ok && result.value.value).toBe('Alice@Example.com')
  })

  it('cannot be mutated', () => {
    const result = Email.parse('alice@example.com')

    expect(result.ok && Object.isFrozen(result.value)).toBe(true)
  })
})
