import type { FormState } from '@/presentation/forms/form-state'

/** Signature of a Server Action driven by `useActionState`, handed to forms by their page. */
export type FormAction = (previous: FormState, formData: FormData) => Promise<FormState>
