import { describe, expect, it } from 'vitest'
import { Family } from '@/core/entities/family'
import { aMember, aUnion, memberId } from '@tests/support/family-fixtures'

const awa = aMember({ id: memberId('mbr_awa'), firstName: 'Awa', tribe: 'Peul' })
const moussa = aMember({ id: memberId('mbr_moussa'), firstName: 'Moussa', gender: 'MALE' })
const fatou = aMember({ id: memberId('mbr_fatou'), firstName: 'Fatou', clan: 'Sow' })
const eloise = aMember({ id: memberId('mbr_eloise'), firstName: 'Éloïse', biography: 'Peul' })

const marriage = aUnion({
  id: 'uni_marriage',
  children: [{ childId: memberId('mbr_fatou'), filiation: 'BIOLOGICAL' }],
})
const family = Family.of([moussa, fatou, eloise, awa], [marriage])

const firstNames = (members: { firstName: string }[]) => members.map((m) => m.firstName)

describe('Family', () => {
  it('sorts members by first name with French collation', () => {
    expect(firstNames(family.members())).toEqual(['Awa', 'Éloïse', 'Fatou', 'Moussa'])
  })

  it('searches without regard to letter case', () => {
    expect(firstNames(family.search('pEUL'))).toEqual(['Awa'])
  })

  it('searches first name, last name, tribe, ethnicity and clan, but not the biography', () => {
    expect([firstNames(family.search('sow')), firstNames(family.search('diallo')).length]).toEqual([
      ['Fatou'],
      4,
    ])
  })

  it('returns every member for a blank search', () => {
    expect(family.search('  ')).toHaveLength(4)
  })

  it('finds a member, or null for an unknown one', () => {
    expect([
      family.findMember(memberId('mbr_awa'))?.firstName,
      family.findMember(memberId('mbr_x')),
    ]).toEqual(['Awa', null])
  })

  it('gives the unions a member was born into, with the parents and the filiation', () => {
    const [parentUnion] = family.parentUnionsOf(memberId('mbr_fatou'))

    expect([firstNames([...(parentUnion?.parents ?? [])]), parentUnion?.filiation]).toEqual([
      ['Moussa', 'Awa'],
      'BIOLOGICAL',
    ])
  })

  it('gives the unions a member is a parent in, with the partner and the children', () => {
    const [partnerUnion] = family.partnerUnionsOf(memberId('mbr_awa'))

    expect([
      partnerUnion?.partner?.firstName,
      partnerUnion?.children.map((c) => c.member.firstName),
    ]).toEqual(['Moussa', ['Fatou']])
  })

  it('orders members sharing a first name by last name', () => {
    const namesakes = Family.of(
      [
        aMember({ id: memberId('mbr_2'), firstName: 'Awa', lastName: 'Sow' }),
        aMember({ id: memberId('mbr_1'), firstName: 'Awa', lastName: 'Ba' }),
        aMember({ id: memberId('mbr_3'), firstName: 'Awa', lastName: null }),
      ],
      [],
    )

    expect(namesakes.members().map((m) => m.lastName)).toEqual([null, 'Ba', 'Sow'])
  })

  it('skips people a union references but the tree does not contain', () => {
    const dangling = aUnion({
      parent1Id: memberId('mbr_gone'),
      children: [{ childId: memberId('mbr_gone_child'), filiation: 'BIOLOGICAL' }],
    })
    const partial = Family.of([awa], [dangling])

    const [partnerUnion] = partial.partnerUnionsOf(memberId('mbr_awa'))
    expect([partnerUnion?.partner, partnerUnion?.children]).toEqual([null, []])
  })

  it('gives no partner for a union recorded with a single parent', () => {
    const single = Family.of([awa, fatou], [aUnion({ parent1Id: null })])

    expect(single.partnerUnionsOf(memberId('mbr_awa'))[0]?.partner).toBeNull()
  })
})
