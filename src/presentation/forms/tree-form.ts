import type { TreeVisibility } from '@/core/entities/tree'
import type { FormFieldConfig, SubmitLabels } from '@/presentation/forms/form-fields'

export type TreeFormValues = {
  readonly name: string
  readonly description: string
  readonly visibility: TreeVisibility
}

export type VisibilityOption = {
  readonly value: TreeVisibility
  readonly label: string
  readonly hint: string
}

export const TREE_NAME_FIELD: FormFieldConfig = {
  name: 'name',
  label: 'Nom de l’arbre',
  autoComplete: 'off',
}

export const TREE_DESCRIPTION_FIELD = {
  name: 'description',
  label: 'Description',
  hint: 'Facultatif : origines, région, période couverte…',
} as const

export const TREE_VISIBILITY_FIELD = { name: 'visibility', label: 'Visibilité' } as const

export const VISIBILITY_OPTIONS: readonly VisibilityOption[] = [
  {
    value: 'PRIVATE',
    label: 'Privé',
    hint: 'Visible uniquement par vous et les personnes que vous invitez.',
  },
  {
    value: 'SHARED',
    label: 'Partagé',
    hint: 'Destiné à être partagé avec les personnes que vous invitez.',
  },
  {
    value: 'PUBLIC',
    label: 'Public',
    hint: 'Visible par tous, même sans compte, et présenté dans Explorer.',
  },
]

/** Every field of the form, for the error summary's links. */
export const TREE_FORM_FIELDS = [TREE_NAME_FIELD, TREE_DESCRIPTION_FIELD, TREE_VISIBILITY_FIELD]

export const NEW_TREE_VALUES: TreeFormValues = { name: '', description: '', visibility: 'PRIVATE' }

export const CREATE_TREE_SUBMIT: SubmitLabels = {
  label: 'Créer l’arbre',
  pendingLabel: 'Création…',
}

export const UPDATE_TREE_SUBMIT: SubmitLabels = {
  label: 'Enregistrer les modifications',
  pendingLabel: 'Enregistrement…',
}
