import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { Union, type UnionDetailsInput } from '@/core/entities/union'
import { aUnion, dateOf, memberId } from '@tests/support/family-fixtures'

const details = (overrides: Partial<UnionDetailsInput> = {}): UnionDetailsInput => ({
  type: 'MARRIAGE',
  parent1Id: memberId('mbr_moussa'),
  parent2Id: memberId('mbr_awa'),
  startDate: dateOf('1955'),
  endDate: null,
  ...overrides,
})

describe('Union writing', () => {
  it('starts a union without children, the second parent being optional', () => {
    const union = Union.start({ id: 'uni_new', ...details({ parent2Id: null }) })

    expect([union.id, union.type, union.children]).toEqual(['uni_new', 'MARRIAGE', []])
    expect(union.parentIds.map((id) => id.value)).toEqual(['mbr_moussa'])
    expect([union.parent1Id?.value, union.parent2Id]).toEqual(['mbr_moussa', null])
  })

  it('revises the type, dates and parents and says whether anything changed', () => {
    const union = aUnion({ startDate: dateOf('1955') })

    const { union: revised, changed } = union.revise(
      details({ type: 'PARTNERSHIP', parent2Id: memberId('mbr_binta'), endDate: dateOf('1970') }),
    )

    expect(changed).toBe(true)
    expect([revised.type, revised.endDate?.toString(), revised.parent2Id?.value]).toEqual([
      'PARTNERSHIP',
      '1970',
      'mbr_binta',
    ])
  })

  it('keeps the union itself and its children when nothing changed', () => {
    const union = aUnion({
      startDate: dateOf('1955'),
      children: [{ childId: memberId('mbr_fatou'), filiation: 'ADOPTIVE' }],
    })

    const same = union.revise(details())
    const revised = union.revise(details({ startDate: null }))

    expect([same.changed, same.union]).toEqual([false, union])
    expect(revised.union.children).toEqual(union.children)
  })

  it('treats the same parents given in the other order as unchanged', () => {
    const union = aUnion({ startDate: dateOf('1955') })

    const { union: revised, changed } = union.revise(
      details({ parent1Id: memberId('mbr_awa'), parent2Id: memberId('mbr_moussa') }),
    )

    expect(changed).toBe(false)
    expect(revised.parent1Id?.value).toBe('mbr_moussa')
  })

  it('finds a union of the family by its id', () => {
    const family = Family.of([], [aUnion({ id: 'uni_1' })])

    expect(family.findUnion('uni_1')?.id).toBe('uni_1')
    expect(family.findUnion('uni_missing')).toBeNull()
  })
})
