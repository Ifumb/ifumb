import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/shared/errors/domain-error'
import { aMember, dateOf } from '@tests/support/family-fixtures'

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

  it('masks a living member on request', () => {
    const { member, changed } = aMember().setVisibilityMask('MASKED')

    expect([changed, member.visibilityMask]).toEqual([true, 'MASKED'])
  })

  it('refuses to mask a deceased member', () => {
    const deceased = aMember({ deathDate: dateOf('2020') })

    expect(() => deceased.setVisibilityMask('MASKED')).toThrow(DomainError)
  })

  it('is a no-op when the mask does not change', () => {
    const { changed } = aMember().setVisibilityMask('STANDARD')

    expect(changed).toBe(false)
  })

  it('withholds dates, places, photo and biography once masked, keeping name and culture', () => {
    const member = aMember({
      birthDate: dateOf('1932-05'),
      birthPlace: 'Conakry',
      originRegion: 'Fouta-Djalon',
      biography: 'Une vie bien remplie.',
      photoUrl: 'https://example.com/awa.jpg',
      tribe: 'Peul',
    }).setVisibilityMask('MASKED').member

    expect(member.publicFacts()).toMatchObject({
      firstName: 'Awa',
      tribe: 'Peul',
      birthDate: null,
      birthPlace: null,
      originRegion: null,
      biography: null,
      photoUrl: null,
    })
  })

  it('reveals every fact again through publicFacts once unmasked', () => {
    const masked = aMember({ birthPlace: 'Conakry' }).setVisibilityMask('MASKED').member
    const unmasked = masked.setVisibilityMask('STANDARD').member

    expect(unmasked.publicFacts().birthPlace).toBe('Conakry')
  })

  it('resets the mask to standard once a living member is recorded as deceased', () => {
    const masked = aMember().setVisibilityMask('MASKED').member

    const { member } = masked.revise({ ...masked.details, deathDate: dateOf('2020') })

    expect(member.visibilityMask).toBe('STANDARD')
  })
})
