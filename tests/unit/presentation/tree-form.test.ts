import { describe, expect, it } from 'vitest'
import { TREE_DESCRIPTION_MAX_LENGTH, TREE_NAME_MAX_LENGTH } from '@/core/entities/tree'
import { UPDATE_TREE_ERRORS } from '@/presentation/errors/tree-error-messages'
import { TREE_FORM_FIELDS, VISIBILITY_OPTIONS } from '@/presentation/forms/tree-form'
import { treeFormSchema } from '@/presentation/schemas/tree-form-schema'

const valid = { name: ' Famille Diallo ', description: '  ', visibility: 'SHARED' }

const errorsOf = (values: Record<string, string>) => {
  const parsed = treeFormSchema.safeParse(values)
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]))
}

describe('treeFormSchema', () => {
  it('accepts the three fields, trimmed', () => {
    expect(treeFormSchema.parse(valid)).toEqual({
      name: 'Famille Diallo',
      description: '',
      visibility: 'SHARED',
    })
  })

  it.each([
    [{ name: '   ' }, 'name', 'Le nom de l’arbre est requis'],
    [
      { name: 'x'.repeat(TREE_NAME_MAX_LENGTH + 1) },
      'name',
      'Le nom ne peut pas dépasser 200 caractères',
    ],
    [
      { description: 'x'.repeat(TREE_DESCRIPTION_MAX_LENGTH + 1) },
      'description',
      'La description ne peut pas dépasser 2000 caractères',
    ],
    [{ visibility: 'EVERYONE' }, 'visibility', 'Choisissez une visibilité'],
    [{ visibility: '' }, 'visibility', 'Choisissez une visibilité'],
  ])('refuses %o on %s', (patch, field, message) => {
    expect(errorsOf({ ...valid, ...patch })).toEqual({ [field]: message })
  })
})

describe('tree form configuration', () => {
  it('offers the three visibilities with a hint each', () => {
    expect(VISIBILITY_OPTIONS.map((option) => [option.value, option.label])).toEqual([
      ['PRIVATE', 'Privé'],
      ['SHARED', 'Partagé'],
      ['PUBLIC', 'Public'],
    ])
    expect(VISIBILITY_OPTIONS.every((option) => option.hint.length > 0)).toBe(true)
  })

  it('names every field for the error summary', () => {
    expect(TREE_FORM_FIELDS.map(({ name, label }) => [name, label])).toEqual([
      ['name', 'Nom de l’arbre'],
      ['description', 'Description'],
      ['visibility', 'Visibilité'],
    ])
  })

  it('explains every refusal of an update', () => {
    expect(Object.values(UPDATE_TREE_ERRORS).every((message) => message.length > 0)).toBe(true)
  })
})
