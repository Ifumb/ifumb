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

  it('keeps the photo URL', () => {
    const photoUrl = 'https://example.supabase.co/storage/v1/object/public/member-photos/awa.jpg'

    expect(aMember({ photoUrl }).details.photoUrl).toBe(photoUrl)
  })

  it('splits comma-separated tribes, trimming and dropping blanks', () => {
    expect(aMember({ tribe: ' Peul, ,Malinké ' }).tribes).toEqual(['Peul', 'Malinké'])
  })

  it('splits comma-separated ethnicities', () => {
    expect(aMember({ ethnicity: 'Mandingue,Soninké' }).ethnicities).toEqual([
      'Mandingue',
      'Soninké',
    ])
  })

  it('has no tribe nor ethnicity when none is recorded', () => {
    expect([aMember().tribes, aMember().ethnicities]).toEqual([[], []])
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(aMember())).toBe(true)
  })
})
