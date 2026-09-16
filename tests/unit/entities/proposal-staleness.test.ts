import { describe, expect, it } from 'vitest'
import { isOutdated } from '@/core/entities/proposal-staleness'

describe('isOutdated', () => {
  it('is never outdated when nothing was recorded before (a creation)', () => {
    expect(isOutdated(null, { tribe: 'Soninke' })).toBe(false)
  })

  it('is not outdated when every recorded field still matches', () => {
    expect(isOutdated({ tribe: 'Peul', nickname: null }, { tribe: 'Peul', nickname: null })).toBe(
      false,
    )
  })

  it('is outdated when a recorded field no longer matches', () => {
    expect(isOutdated({ tribe: 'Peul' }, { tribe: 'Soninke' })).toBe(true)
  })

  it('treats a missing current field as null', () => {
    expect(isOutdated({ nickname: null }, {})).toBe(false)
    expect(isOutdated({ nickname: 'Mama' }, {})).toBe(true)
  })
})
