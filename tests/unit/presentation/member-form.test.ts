import { describe, expect, it } from 'vitest'
import { MEMBER_TEXT_LIMITS } from '@/core/entities/member'
import {
  CREATE_MEMBER_ERRORS,
  UPDATE_MEMBER_ERRORS,
} from '@/presentation/errors/member-error-messages'
import {
  MEMBER_FORM_ENTRIES,
  MEMBER_FORM_FIELDS,
  memberFormValues,
} from '@/presentation/forms/member-form'
import { MONTH_OPTIONS } from '@/presentation/forms/partial-date-options'
import { memberFormSchema } from '@/presentation/schemas/member-form-schema'
import { dateOf } from '@tests/support/family-fixtures'
import { memberInput } from '@tests/support/member-inputs'

const empty = Object.fromEntries(MEMBER_FORM_ENTRIES.map((name) => [name, '']))
const valid = { ...empty, firstName: ' Awa ', certainty: 'CONFIRMED' }

const errorsOf = (values: Record<string, string>) => {
  const parsed = memberFormSchema.safeParse({ ...valid, ...values })
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
}

describe('memberFormSchema', () => {
  it('turns empty entries into unknown facts', () => {
    expect(memberFormSchema.parse(valid)).toEqual({
      ...memberInput({ tribe: null, birthDate: null }),
      firstName: 'Awa',
      lastName: null,
      gender: null,
    })
  })

  it('composes each date from its day, month and year', () => {
    const parsed = memberFormSchema.parse({
      ...valid,
      ...{ birthDay: '7', birthMonth: '3', birthYear: '1954', birthDateApprox: 'on' },
      ...{ deathMonth: '11', deathYear: '2001', gender: 'MALE', tribe: ' Peul ' },
    })

    expect(parsed).toMatchObject({
      birthDate: dateOf('1954-03-07'),
      birthDateApprox: true,
      deathDate: dateOf('2001-11'),
      gender: 'MALE',
      tribe: 'Peul',
    })
  })

  it.each([
    [{ firstName: '  ' }, 'firstName', 'Le prénom est requis'],
    [
      { tribe: 'x'.repeat(MEMBER_TEXT_LIMITS.tribe + 1) },
      'tribe',
      'Ce champ ne peut pas dépasser 150 caractères',
    ],
    [{ gender: 'MAN' }, 'gender', 'Choisissez un genre'],
    [{ certainty: '' }, 'certainty', 'Choisissez un niveau de certitude'],
    [{ birthMonth: '3' }, 'birthDate', 'L’année est requise si vous indiquez un jour ou un mois'],
    [
      { birthDay: '7', birthYear: '1954' },
      'birthDate',
      'Le mois est requis si vous indiquez un jour',
    ],
    [{ deathYear: '54' }, 'deathDate', 'L’année doit comporter quatre chiffres'],
    [
      { deathDay: '31', deathMonth: '2', deathYear: '2001' },
      'deathDate',
      'Cette date n’existe pas',
    ],
    [{ birthDay: 'x', birthMonth: '2', birthYear: '2001' }, 'birthDate', 'Cette date n’existe pas'],
    [{ birthMonth: '13', birthYear: '2001' }, 'birthDate', 'Cette date n’existe pas'],
  ])('refuses %o on %s', (patch, field, message) => {
    expect(errorsOf(patch)).toEqual({ [field]: message })
  })
})

describe('member form configuration', () => {
  it('shows a stored member as the entries of the form', () => {
    const member = {
      ...memberInput({ birthDate: dateOf('1954-03-07'), deathDate: dateOf('2001') }),
      id: 'mbr_awa',
      photoUrl: null,
      birthDateApprox: true,
    }

    expect(memberFormValues(member)).toMatchObject({
      firstName: 'Awa',
      nickname: '',
      gender: 'FEMALE',
      ...{ birthDay: '7', birthMonth: '3', birthYear: '1954', birthDateApprox: 'on' },
      ...{ deathDay: '', deathMonth: '', deathYear: '2001', tribe: 'Peul', biography: '' },
    })
  })

  it('round-trips a member through its form entries', () => {
    const member = { ...memberInput({ deathDate: dateOf('2001-11-30') }), id: 'm', photoUrl: null }

    expect(memberFormSchema.parse({ ...empty, ...memberFormValues(member) })).toEqual(
      memberInput({
        deathDate: dateOf('2001-11-30'),
      }),
    )
  })

  it('names the months in French and every field for the error summary', () => {
    expect(MONTH_OPTIONS.map((option) => option.label)).toContain('mars')
    expect(MEMBER_FORM_FIELDS.map((field) => field.name)).toEqual([
      'firstName',
      'lastName',
      'nickname',
      'gender',
      'certainty',
      'birthDate',
      'birthDateApprox',
      'deathDate',
      'birthPlace',
      'tribe',
      'clan',
      'ethnicity',
      'originRegion',
      'biography',
    ])
  })

  it('places the date order refusal on the death date and explains every other refusal', () => {
    expect(UPDATE_MEMBER_ERRORS.DEATH_BEFORE_BIRTH.field).toBe('deathDate')
    expect(CREATE_MEMBER_ERRORS.DEATH_BEFORE_BIRTH.field).toBe('deathDate')
    expect(Object.values(UPDATE_MEMBER_ERRORS).every(({ message }) => message.length > 0)).toBe(
      true,
    )
  })
})
