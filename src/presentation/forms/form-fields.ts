/** Declarative description of a text input rendered by `ActionForm`. */
export type FormFieldConfig = {
  readonly name: string
  readonly label: string
  readonly type?: 'text' | 'email' | 'password'
  readonly autoComplete: string
}

export type SubmitLabels = {
  readonly label: string
  readonly pendingLabel: string
}
