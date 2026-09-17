import { describe, expect, it } from 'vitest'
import { safeRedirectTarget } from '@/presentation/security/safe-redirect'

describe('safeRedirectTarget', () => {
  it('accepts a relative path', () => {
    expect(safeRedirectTarget('/invitations/accept?token=abc')).toBe(
      '/invitations/accept?token=abc',
    )
  })

  it('rejects an absolute URL', () => {
    expect(safeRedirectTarget('https://evil.example/phish')).toBeNull()
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeRedirectTarget('//evil.example/phish')).toBeNull()
  })

  it('rejects a javascript: URL', () => {
    expect(safeRedirectTarget('javascript:alert(1)')).toBeNull()
  })

  it('rejects an empty or missing value', () => {
    expect([safeRedirectTarget(''), safeRedirectTarget(null), safeRedirectTarget(undefined)]).toEqual(
      [null, null, null],
    )
  })
})
