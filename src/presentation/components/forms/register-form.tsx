'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useActionState } from 'react'
import { FieldError } from '@/presentation/components/forms/field-error'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { fieldId, TextField } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import { REGISTER_FORM } from '@/presentation/forms/auth-forms'
import type { FormAction } from '@/presentation/forms/form-action'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'

const CONSENT_FIELD_LABELS = [
  { name: 'ageConfirmed', label: "Déclaration d'âge" },
  { name: 'termsAccepted', label: 'Acceptation des conditions' },
] as const

type RegisterFormProps = Readonly<{
  action: FormAction
  hiddenValues?: Readonly<Record<string, string>>
}>

// reason: l'inscription a besoin de cases a cocher, que le systeme de formulaire generique
// (ActionForm/FormFieldConfig) ne modelise pas - un formulaire dedie evite d'etendre ce systeme
// partage pour un seul appelant.
export function RegisterForm({ action, hiddenValues = {} }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormErrorSummary
        state={state}
        fields={[...REGISTER_FORM.fields, ...CONSENT_FIELD_LABELS]}
      />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      {Object.entries(hiddenValues).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {REGISTER_FORM.fields.map((field) => (
        <TextField
          key={field.name}
          {...field}
          error={state.fieldErrors?.[field.name]?.[0]}
          defaultValue={state.values?.[field.name]}
        />
      ))}
      <ConsentCheckbox
        name="ageConfirmed"
        label="Je confirme avoir 16 ans ou plus."
        error={state.fieldErrors?.ageConfirmed?.[0]}
      />
      <ConsentCheckbox
        name="termsAccepted"
        label={
          <>
            J’accepte les <Link href="/legal/cgu">conditions d’utilisation</Link> et la{' '}
            <Link href="/legal/confidentialite">politique de confidentialité</Link>.
          </>
        }
        error={state.fieldErrors?.termsAccepted?.[0]}
      />
      <Button type="submit" loading={pending} className="w-full">
        {pending ? REGISTER_FORM.submit.pendingLabel : REGISTER_FORM.submit.label}
      </Button>
    </form>
  )
}

type ConsentCheckboxProps = Readonly<{ name: string; label: ReactNode; error?: string }>

/** A required consent checkbox (age, terms) - distinct from the optional `CheckboxField` used by
 * member forms: this one is always required and reads a validation error like `TextField`'s. */
function ConsentCheckbox({ name, label, error }: ConsentCheckboxProps) {
  const inputId = fieldId(name)
  const errorId = `${inputId}-error`
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 size-4 shrink-0"
        />
        <label htmlFor={inputId} className="text-sm">
          {label}
        </label>
      </div>
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}
