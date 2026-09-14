import { describe, expect, it } from 'vitest'
import { formatPartialDate, lifespanLabel } from '@/presentation/formatting/partial-date-format'
import {
  parseMemberSearch,
  SEARCH_QUERY_MAX_LENGTH,
} from '@/presentation/schemas/member-search-schema'
import { dateOf } from '@tests/support/family-fixtures'

describe('formatPartialDate', () => {
  it.each([
    ['1954', '1954'],
    ['1954-03', 'mars 1954'],
    ['1954-03-12', '12 mars 1954'],
  ])('writes %s as "%s"', (raw, label) => {
    expect(formatPartialDate(dateOf(raw))).toBe(label)
  })

  it('marks an approximate date', () => {
    expect(formatPartialDate(dateOf('1954'), { approximate: true })).toBe('vers 1954')
  })
})

describe('lifespanLabel', () => {
  it.each([
    [dateOf('1932-05'), dateOf('2001-01-02'), '1932 – 2001'],
    [dateOf('1932'), null, '1932 –'],
    [null, dateOf('2001'), '? – 2001'],
    [null, null, null],
  ])('labels %o to %o', (birth, death, label) => {
    expect(lifespanLabel(birth, death)).toBe(label)
  })
})

describe('parseMemberSearch', () => {
  it('reads and trims the q parameter', () => {
    expect(parseMemberSearch({ q: '  peul ' })).toBe('peul')
  })

  it('keeps the first value when q is repeated', () => {
    expect(parseMemberSearch({ q: ['peul', 'sow'] })).toBe('peul')
  })

  it('treats a blank or missing q as no search', () => {
    expect([parseMemberSearch({ q: '   ' }), parseMemberSearch({})]).toEqual([undefined, undefined])
  })

  it('cuts an overlong search to the maximum length', () => {
    const query = parseMemberSearch({ q: 'a'.repeat(SEARCH_QUERY_MAX_LENGTH + 20) })

    expect(query).toHaveLength(SEARCH_QUERY_MAX_LENGTH)
  })
})
