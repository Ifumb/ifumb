import { describe, expect, it } from 'vitest'
import { PartialDate } from '@/core/shared/value-objects/partial-date'

const INVALID = { ok: false, error: { kind: 'INVALID_PARTIAL_DATE' } }

function parts(raw: string) {
  const parsed = PartialDate.parse(raw)
  if (!parsed.ok) return parsed
  const { year, month, day, precision } = parsed.value
  return { year, month, day, precision }
}

describe('PartialDate', () => {
  it('reads a year alone', () => {
    expect(parts('1954')).toEqual({ year: 1954, month: null, day: null, precision: 'year' })
  })

  it('reads a year and a month', () => {
    expect(parts('1954-03')).toEqual({ year: 1954, month: 3, day: null, precision: 'month' })
  })

  it('reads a full date', () => {
    expect(parts('1954-03-12')).toEqual({ year: 1954, month: 3, day: 12, precision: 'day' })
  })

  it('reads the timestamp text left by the legacy date-to-string migration, as a day', () => {
    expect(parts('1954-03-12 00:00:00')).toEqual({
      year: 1954,
      month: 3,
      day: 12,
      precision: 'day',
    })
  })

  it('rejects another date format', () => {
    expect(PartialDate.parse('12/03/1954')).toEqual(INVALID)
  })

  it('rejects a month that does not exist', () => {
    expect(PartialDate.parse('1954-13')).toEqual(INVALID)
  })

  it('rejects a day that does not exist in its month', () => {
    expect(PartialDate.parse('1954-02-30')).toEqual(INVALID)
  })

  it('rejects an empty value', () => {
    expect(PartialDate.parse('  ')).toEqual(INVALID)
  })

  it('cannot be mutated', () => {
    const parsed = PartialDate.parse('1954')

    expect(parsed.ok && Object.isFrozen(parsed.value)).toBe(true)
  })

  it.each(['1954', '1954-03', '1954-03-07'])('writes %s back in its stored form', (raw) => {
    const parsed = PartialDate.parse(raw)

    expect(parsed.ok && parsed.value.toString()).toBe(raw)
  })

  it('writes a legacy timestamp as its day', () => {
    const parsed = PartialDate.parse('1954-03-07 00:00:00')

    expect(parsed.ok && parsed.value.toString()).toBe('1954-03-07')
  })
})
