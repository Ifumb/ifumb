import { z } from 'zod'

export type FieldErrors = Readonly<Partial<Record<string, string[]>>>

/** What a Server Action hands back to its form through `useActionState`. */
export type FormState = {
  readonly status: 'idle' | 'error' | 'success'
  readonly fieldErrors?: FieldErrors
  readonly message?: string
  /** Non-secret values echoed back so the form keeps what the user typed. */
  readonly values?: Readonly<Record<string, string>>
}

export const INITIAL_FORM_STATE: FormState = { status: 'idle' }

export function validationFailed(
  error: z.ZodError,
  values?: Readonly<Record<string, string>>,
): FormState {
  return { status: 'error', fieldErrors: z.flattenError(error).fieldErrors, values }
}

export function failed(message: string, values?: Readonly<Record<string, string>>): FormState {
  return { status: 'error', message, values }
}

export function fieldFailed(
  field: string,
  message: string,
  values?: Readonly<Record<string, string>>,
): FormState {
  return { status: 'error', fieldErrors: { [field]: [message] }, values }
}

/** Shows a use case error on its field when it has one, otherwise as the form-level message. */
export function failedAt(
  placement: { readonly field?: string; readonly message: string },
  values?: Readonly<Record<string, string>>,
): FormState {
  return placement.field
    ? fieldFailed(placement.field, placement.message, values)
    : failed(placement.message, values)
}

export function succeeded(message: string): FormState {
  return { status: 'success', message }
}

/** Reads a text entry from submitted form data; files and missing entries become ''. */
export function textEntry(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}
