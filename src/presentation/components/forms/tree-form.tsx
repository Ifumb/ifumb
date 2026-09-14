'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { RadioGroupField } from '@/presentation/components/forms/radio-group-field'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { TextAreaField } from '@/presentation/components/forms/text-area-field'
import { TextField } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import type { SubmitLabels } from '@/presentation/forms/form-fields'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'
import {
  TREE_DESCRIPTION_FIELD,
  TREE_FORM_FIELDS,
  TREE_NAME_FIELD,
  TREE_VISIBILITY_FIELD,
  VISIBILITY_OPTIONS,
  type TreeFormValues,
} from '@/presentation/forms/tree-form'

type TreeFormProps = Readonly<{
  action: FormAction
  initialValues: TreeFormValues
  submit: SubmitLabels
}>

/** Creates or edits a tree; after an error, the form keeps what was typed. */
export function TreeForm({ action, initialValues, submit }: TreeFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-5">
      <FormErrorSummary state={state} fields={TREE_FORM_FIELDS} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <TreeFields state={state} values={{ ...initialValues, ...state.values }} />
      <Button type="submit" loading={pending}>
        {pending ? submit.pendingLabel : submit.label}
      </Button>
    </form>
  )
}

function TreeFields({
  state,
  values,
}: Readonly<{ state: FormState; values: Record<string, string> }>) {
  const errorOf = (name: string) => state.fieldErrors?.[name]?.[0]
  return (
    <>
      <TextField {...TREE_NAME_FIELD} error={errorOf('name')} defaultValue={values.name} />
      <TextAreaField
        {...TREE_DESCRIPTION_FIELD}
        error={errorOf('description')}
        defaultValue={values.description}
      />
      <RadioGroupField
        {...TREE_VISIBILITY_FIELD}
        options={VISIBILITY_OPTIONS}
        error={errorOf('visibility')}
        defaultValue={values.visibility}
      />
    </>
  )
}
