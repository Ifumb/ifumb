import { describe, expect, it } from 'vitest'
import { AuditCursor } from '@/core/shared/value-objects/audit-cursor'

describe('AuditCursor', () => {
  it('round-trips a timestamp and an id', () => {
    const cursor = AuditCursor.of(new Date('2026-03-01T10:20:30.456Z'), 'clx_entry_1')

    const parsed = AuditCursor.parse(cursor.token)

    expect([parsed?.createdAt.toISOString(), parsed?.id]).toEqual([
      '2026-03-01T10:20:30.456Z',
      'clx_entry_1',
    ])
  })

  it('gives an opaque token safe in a URL', () => {
    expect(AuditCursor.of(new Date(0), 'a/b+c').token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it.each([
    ['an empty token', ''],
    ['a token that is not base64', '***'],
    ['a token without an id', Buffer.from('2026-03-01T10:20:30.456Z|').toString('base64url')],
    ['a token with an invalid date', Buffer.from('not-a-date|id').toString('base64url')],
  ])('ignores %s', (_, token) => {
    expect(AuditCursor.parse(token)).toBeNull()
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(AuditCursor.of(new Date(0), 'id'))).toBe(true)
  })
})
