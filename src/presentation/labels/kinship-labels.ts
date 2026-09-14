import type { Branch, Kinship } from '@/core/entities/kinship'
import type { Gender } from '@/core/entities/member'
import type { UnionType } from '@/core/entities/union'

type GenderedTerm = readonly [feminine: string, masculine: string, neutral: string]
type BloodKinship = Extract<Kinship, { kind: 'blood' }>

/** Blood relations by "generations up, generations down", carried over from the legacy labels. */
const BLOOD_TERMS: Readonly<Record<string, GenderedTerm>> = {
  '1,0': ['mère', 'père', 'parent'],
  '0,1': ['fille', 'fils', 'enfant'],
  '2,0': ['grand-mère', 'grand-père', 'grand-parent'],
  '0,2': ['petite-fille', 'petit-fils', 'petit-enfant'],
  '1,1': ['sœur', 'frère', 'frère/sœur'],
  '2,1': ['tante', 'oncle', 'oncle/tante'],
  '1,2': ['nièce', 'neveu', 'neveu/nièce'],
  '2,2': ['cousine germaine', 'cousin germain', 'cousin germain'],
  '3,0': ['arrière-grand-mère', 'arrière-grand-père', 'arrière-grand-parent'],
  '0,3': ['arrière-petite-fille', 'arrière-petit-fils', 'arrière-petit-enfant'],
  '3,1': ['grand-tante', 'grand-oncle', 'grand-oncle/tante'],
  '1,3': ['petite-nièce', 'petit-neveu', 'petit-neveu/nièce'],
  '4,0': [
    'arrière-arrière-grand-mère',
    'arrière-arrière-grand-père',
    'arrière-arrière-grand-parent',
  ],
  '0,4': [
    'arrière-arrière-petite-fille',
    'arrière-arrière-petit-fils',
    'arrière-arrière-petit-enfant',
  ],
  '3,3': ['cousine au 2ème degré', 'cousin au 2ème degré', 'cousin au 2ème degré'],
}

const HALF_SIBLING: GenderedTerm = ['demi-sœur', 'demi-frère', 'demi-frère/sœur']

const PARTNER_TERMS: Readonly<Record<UnionType, GenderedTerm>> = {
  MARRIAGE: ['épouse', 'époux', 'conjoint'],
  PARTNERSHIP: ['partenaire', 'partenaire', 'partenaire'],
  BIOLOGICAL: ['co-parent', 'co-parent', 'co-parent'],
}

// Cousins further than the second degree are named by number, from the fourth generation up.
const FIRST_NUMBERED_COUSIN_GENERATION = 4

export const BRANCH_LABELS: Readonly<Record<Branch, string>> = {
  maternal: 'branche maternelle',
  paternal: 'branche paternelle',
}

/** What the second member is to the first, in French, agreed with the second member's gender. */
export function kinshipLabel(kinship: Kinship, gender: Gender | null): string {
  switch (kinship.kind) {
    case 'blood':
      return bloodLabel(kinship, gender)
    case 'partner':
      return inGender(PARTNER_TERMS[kinship.unionType], gender)
    case 'alliance':
      return `lien par alliance (${kinship.links} liens)`
  }
}

/** The civil degree of a blood relation: one per generation between the two members. */
export function kinshipDegreeLabel(kinship: Kinship): string | null {
  if (kinship.kind !== 'blood') return null
  const degree = kinship.ups + kinship.downs
  return `${degree} degré${degree > 1 ? 's' : ''}`
}

function bloodLabel({ ups, downs, fullSiblings }: BloodKinship, gender: Gender | null): string {
  if (ups === 1 && downs === 1 && !fullSiblings) return inGender(HALF_SIBLING, gender)
  const term = BLOOD_TERMS[`${ups},${downs}`]
  if (term) return inGender(term, gender)
  if (ups === downs && ups >= FIRST_NUMBERED_COUSIN_GENERATION) {
    const degree = `au ${ups - 1}ème degré`
    return inGender([`cousine ${degree}`, `cousin ${degree}`, `cousin ${degree}`], gender)
  }
  return `lien en ${ups + downs} degrés`
}

function inGender([feminine, masculine, neutral]: GenderedTerm, gender: Gender | null): string {
  if (gender === 'FEMALE') return feminine
  return gender === 'MALE' ? masculine : neutral
}
