import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import type { FormFieldConfig, SubmitLabels } from '@/presentation/forms/form-fields'
import { ROLE_LABELS } from '@/presentation/labels/tree-labels'

export const INVITE_EMAIL_FIELD: FormFieldConfig = {
  name: 'email',
  label: 'Email',
  type: 'email',
  autoComplete: 'off',
}
export const INVITE_ROLE_FIELD = { name: 'role', label: 'Rôle' } as const

export const ROLE_OPTIONS: readonly SelectOption[] = [
  { value: 'EDITOR', label: ROLE_LABELS.EDITOR },
  { value: 'VIEWER', label: ROLE_LABELS.VIEWER },
]

/** Every field of the invite form, for the error summary's links. */
export const INVITE_FORM_FIELDS = [INVITE_EMAIL_FIELD, INVITE_ROLE_FIELD]
export const INVITE_FORM_ENTRIES = ['email', 'role']

export const SEND_INVITATION_SUBMIT: SubmitLabels = {
  label: 'Envoyer l’invitation',
  pendingLabel: 'Envoi…',
}
