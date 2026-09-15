import { describe, expect, it } from 'vitest'
import type { UnionPage } from '@/core/use-cases/get-union'
import type { MemberSummary } from '@/core/use-cases/member-views'
import type { UnionDetails } from '@/core/use-cases/union-views'
import {
  ADD_UNION_CHILD_ERRORS,
  UPDATE_UNION_ERRORS,
} from '@/presentation/errors/union-error-messages'
import {
  memberOption,
  newUnionValues,
  UNION_FORM_ENTRIES,
  UNION_TYPE_OPTIONS,
  unionFormValues,
} from '@/presentation/forms/union-form'
import { toUnionPageViewModel, unionTitle } from '@/presentation/mappers/union-page-view-models'
import {
  parseNewUnionParent,
  unionChildFormSchema,
  unionFormSchema,
} from '@/presentation/schemas/union-form-schema'
import { dateOf } from '@tests/support/family-fixtures'

const empty = Object.fromEntries(UNION_FORM_ENTRIES.map((name) => [name, '']))
const valid = { ...empty, parent1Id: 'mbr_moussa', type: 'MARRIAGE' }

const errorsOf = (values: Record<string, string>) => {
  const parsed = unionFormSchema.safeParse({ ...valid, ...values })
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
}

const summary = (id: string, firstName: string, birth: string | null = null): MemberSummary => ({
  id,
  firstName,
  lastName: 'Diallo',
  nickname: null,
  birthDate: birth ? dateOf(birth) : null,
  birthDateApprox: false,
  deathDate: null,
  tribe: null,
  ethnicity: null,
})

describe('unionFormSchema', () => {
  it('reads an empty second parent as unknown and composes the dates', () => {
    expect(
      unionFormSchema.parse({ ...valid, startYear: '1955', startMonth: '6', endYear: '1970' }),
    ).toEqual({
      parent1Id: 'mbr_moussa',
      parent2Id: null,
      type: 'MARRIAGE',
      startDate: dateOf('1955-06'),
      endDate: dateOf('1970'),
    })
  })

  it.each([
    [{ parent1Id: '' }, 'parent1Id', 'Choisissez au moins un parent'],
    [{ parent2Id: 'mbr_moussa' }, 'parent2Id', 'Choisissez deux parents différents'],
    [{ type: 'FRIENDSHIP' }, 'type', 'Choisissez un type d’union'],
    [{ startMonth: '6' }, 'startDate', 'L’année est requise si vous indiquez un jour ou un mois'],
    [{ endDay: '31', endMonth: '2', endYear: '1970' }, 'endDate', 'Cette date n’existe pas'],
  ])('refuses %o on %s', (patch, field, message) => {
    expect(errorsOf(patch)).toEqual({ [field]: message })
  })

  it('refuses a child form without a member or with an unknown filiation', () => {
    const parsed = unionChildFormSchema.safeParse({ childId: ' ', filiation: 'FOSTER' })

    expect(parsed.success ? [] : parsed.error.issues.map((issue) => issue.message)).toEqual([
      'Choisissez un membre',
      'Choisissez une filiation',
    ])
  })

  it('reads the first parent of a new union from the URL', () => {
    expect(parseNewUnionParent({ parent: ['mbr_awa', 'mbr_x'] })).toBe('mbr_awa')
    expect(parseNewUnionParent({})).toBeNull()
  })
})

describe('union form configuration', () => {
  it('names members with their lifespan and explains every union type', () => {
    expect(memberOption(summary('mbr_awa', 'Awa', '1932'))).toEqual({
      value: 'mbr_awa',
      label: 'Awa Diallo (1932 –)',
    })
    expect(memberOption(summary('mbr_ali', 'Ali')).label).toBe('Ali Diallo')
    expect(UNION_TYPE_OPTIONS.map(({ label }) => label)).toEqual([
      'Mariage',
      'Union libre',
      'Lien biologique',
    ])
    expect(UNION_TYPE_OPTIONS.every(({ hint }) => hint.length > 0)).toBe(true)
  })

  it('shows a stored union as the entries of the form, its single parent first', () => {
    const details: UnionDetails = {
      ...{ id: 'uni_1', type: 'BIOLOGICAL', parent1Id: null, parent2Id: 'mbr_awa' },
      ...{ startDate: dateOf('1955-06-07'), endDate: null },
    }

    expect(unionFormValues(details)).toEqual({
      ...{ parent1Id: 'mbr_awa', parent2Id: '', type: 'BIOLOGICAL' },
      ...{
        startDay: '7',
        startMonth: '6',
        startYear: '1955',
        endDay: '',
        endMonth: '',
        endYear: '',
      },
    })
    expect(newUnionValues('mbr_awa')).toEqual({ type: 'BIOLOGICAL', parent1Id: 'mbr_awa' })
  })

  it('places refusals on the field they concern', () => {
    expect(UPDATE_UNION_ERRORS.SAME_PARENT_TWICE.field).toBe('parent2Id')
    expect(UPDATE_UNION_ERRORS.END_BEFORE_START.field).toBe('endDate')
    expect(ADD_UNION_CHILD_ERRORS.FAMILY_CYCLE.field).toBe('childId')
    expect(Object.values(UPDATE_UNION_ERRORS).every(({ message }) => message.length > 0)).toBe(true)
  })
})

describe('union page view model', () => {
  const page: UnionPage = {
    tree: { id: 'tree_1', name: 'Famille Diallo', isPublic: false },
    union: {
      ...{ id: 'uni_1', type: 'MARRIAGE', startDate: dateOf('1955'), endDate: null },
      parents: [{ id: 'mbr_moussa', firstName: 'Moussa', lastName: 'Diallo' }],
      children: [
        { person: { id: 'mbr_fatou', firstName: 'Fatou', lastName: null }, filiation: 'ADOPTIVE' },
      ],
    },
    canManage: true,
    memberOptions: [
      summary('mbr_moussa', 'Moussa'),
      summary('mbr_fatou', 'Fatou'),
      summary('mbr_ali', 'Ali'),
    ],
  }

  it('describes the union and offers the owner only the members not linked yet', () => {
    expect(toUnionPageViewModel(page)).toEqual({
      title: 'Union de Moussa Diallo',
      typeLabel: 'Mariage',
      datesLabel: 'depuis 1955',
      tree: { name: 'Famille Diallo', href: '/tree/tree_1' },
      parents: [{ href: '/tree/tree_1/member/mbr_moussa', name: 'Moussa Diallo' }],
      children: [
        {
          id: 'mbr_fatou',
          href: '/tree/tree_1/member/mbr_fatou',
          name: 'Fatou',
          filiationLabel: 'Adoptif',
        },
      ],
      management: {
        editHref: '/tree/tree_1/union/uni_1/edit',
        deleteHref: '/tree/tree_1/union/uni_1/delete',
        childOptions: [{ value: 'mbr_ali', label: 'Ali Diallo' }],
      },
    })
  })

  it('offers no management to a reader, and names a union without parents', () => {
    expect(toUnionPageViewModel({ ...page, canManage: false }).management).toBeNull()
    expect(unionTitle([])).toBe('Union sans parent renseigné')
  })
})
