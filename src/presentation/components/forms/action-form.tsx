'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { TextField } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import type { FormFieldConfig, SubmitLabels } from '@/presentation/forms/form-fields'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'

type ActionFormProps = Readonly<{
  action: FormAction
  fields: readonly FormFieldConfig[]
  submit: SubmitLabels
  /** Values the server needs but the user does not type, such as a reset token from the URL. */
  hiddenValues?: Readonly<Record<string, string>>
}>

/** A Server Action form with an announced error summary and a polite success region. */
export function ActionForm({ action, fields, submit, hiddenValues = {} }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormErrorSummary state={state} fields={fields} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <HiddenInputs values={hiddenValues} />
      {fields.map((field) => (
        <TextField
          key={field.name}
          {...field}
          error={state.fieldErrors?.[field.name]?.[0]}
          defaultValue={state.values?.[field.name]}
        />
      ))}
      <SubmitButton labels={submit} pending={pending} />
    </form>
  )
}

function SubmitButton({ labels, pending }: Readonly<{ labels: SubmitLabels; pending: boolean }>) {
  return (
    <Button type="submit" loading={pending} className="w-full">
      {pending ? labels.pendingLabel : labels.label}
    </Button>
  )
}

function HiddenInputs({ values }: Readonly<{ values: Readonly<Record<string, string>> }>) {
  return Object.entries(values).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ))
}
