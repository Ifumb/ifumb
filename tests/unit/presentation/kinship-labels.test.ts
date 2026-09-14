import { describe, expect, it } from 'vitest'
import type { Kinship } from '@/core/entities/kinship'
import { kinshipDegreeLabel, kinshipLabel } from '@/presentation/labels/kinship-labels'

const blood = (ups: number, downs: number, fullSiblings = true): Kinship => ({
  kind: 'blood',
  ups,
  downs,
  fullSiblings,
  branch: null,
})

describe('kinshipLabel', () => {
  it.each([
    [1, 0, 'mère', 'père', 'parent'],
    [0, 1, 'fille', 'fils', 'enfant'],
    [2, 0, 'grand-mère', 'grand-père', 'grand-parent'],
    [0, 2, 'petite-fille', 'petit-fils', 'petit-enfant'],
    [1, 1, 'sœur', 'frère', 'frère/sœur'],
    [2, 1, 'tante', 'oncle', 'oncle/tante'],
    [1, 2, 'nièce', 'neveu', 'neveu/nièce'],
    [2, 2, 'cousine germaine', 'cousin germain', 'cousin germain'],
    [3, 0, 'arrière-grand-mère', 'arrière-grand-père', 'arrière-grand-parent'],
    [0, 3, 'arrière-petite-fille', 'arrière-petit-fils', 'arrière-petit-enfant'],
    [3, 1, 'grand-tante', 'grand-oncle', 'grand-oncle/tante'],
    [1, 3, 'petite-nièce', 'petit-neveu', 'petit-neveu/nièce'],
    [
      4,
      0,
      'arrière-arrière-grand-mère',
      'arrière-arrière-grand-père',
      'arrière-arrière-grand-parent',
    ],
    [
      0,
      4,
      'arrière-arrière-petite-fille',
      'arrière-arrière-petit-fils',
      'arrière-arrière-petit-enfant',
    ],
    [3, 3, 'cousine au 2ème degré', 'cousin au 2ème degré', 'cousin au 2ème degré'],
    [5, 5, 'cousine au 4ème degré', 'cousin au 4ème degré', 'cousin au 4ème degré'],
  ])('names %i up and %i down: %s, %s, %s', (ups, downs, feminine, masculine, neutral) => {
    const kinship = blood(ups, downs)

    expect([
      kinshipLabel(kinship, 'FEMALE'),
      kinshipLabel(kinship, 'MALE'),
      kinshipLabel(kinship, null),
    ]).toEqual([feminine, masculine, neutral])
  })

  it('names half-siblings', () => {
    const half = blood(1, 1, false)

    expect([
      kinshipLabel(half, 'FEMALE'),
      kinshipLabel(half, 'MALE'),
      kinshipLabel(half, 'OTHER'),
    ]).toEqual(['demi-sœur', 'demi-frère', 'demi-frère/sœur'])
  })

  it('falls back to the number of degrees for an unnamed blood relation', () => {
    expect(kinshipLabel(blood(3, 2), 'MALE')).toBe('lien en 5 degrés')
  })

  it.each([
    ['MARRIAGE', 'FEMALE', 'épouse'],
    ['MARRIAGE', 'MALE', 'époux'],
    ['MARRIAGE', null, 'conjoint'],
    ['PARTNERSHIP', 'FEMALE', 'partenaire'],
    ['BIOLOGICAL', 'MALE', 'co-parent'],
  ] as const)('names a partner in a %s union for %s: %s', (unionType, gender, label) => {
    expect(kinshipLabel({ kind: 'partner', unionType }, gender)).toBe(label)
  })

  it('names an alliance with its number of links', () => {
    expect(kinshipLabel({ kind: 'alliance', links: 3 }, 'FEMALE')).toBe(
      'lien par alliance (3 liens)',
    )
  })
})

describe('kinshipDegreeLabel', () => {
  it('counts one degree per generation, as civil law does', () => {
    expect([kinshipDegreeLabel(blood(1, 0)), kinshipDegreeLabel(blood(1, 1))]).toEqual([
      '1 degré',
      '2 degrés',
    ])
  })

  it('has no degree outside blood relations', () => {
    expect(kinshipDegreeLabel({ kind: 'partner', unionType: 'MARRIAGE' })).toBeNull()
  })
})
