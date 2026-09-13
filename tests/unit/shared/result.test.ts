import { describe, expect, it } from 'vitest'
import { err, ok, type Result } from '@/core/shared/result'

describe('Result', () => {
  it('exposes the value of a success', () => {
    const result = ok(42)

    expect(result).toEqual({ ok: true, value: 42 })
  })

  it('exposes the error of a failure', () => {
    const result = err({ kind: 'NOT_FOUND' as const })

    expect(result).toEqual({ ok: false, error: { kind: 'NOT_FOUND' } })
  })

  it('narrows to the value once the ok discriminant is checked', () => {
    const result: Result<number, { kind: 'NOT_FOUND' }> = ok(7)

    const doubled = result.ok ? result.value * 2 : 0

    expect(doubled).toBe(14)
  })
})
