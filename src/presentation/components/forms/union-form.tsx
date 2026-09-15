'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { PartialDateField } from '@/presentation/components/forms/partial-date-field'
import { RadioGroupField } from '@/presentation/components/forms/radio-group-field'
import { SelectField } from '@/presentation/components/forms/select-field'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { Button } from '@/presentation/components/ui/button'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import type { FormAction } from '@/presentation/forms/form-action'
import type { SubmitLabels } from '@/presentation/forms/form-fields'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'
import { DATE_HINT, MONTH_OPTIONS } from '@/presentation/forms/partial-date-options'
import {
  END_DATE_FIELD,
  PARENT1_FIELD,
  PARENT2_FIELD,
  START_DATE_FIELD,
  UNION_FORM_FIELDS,
  UNION_TYPE_FIELD,
  UNION_TYPE_OPTIONS,
  type UnionFormValues,
} from '@/presentation/forms/union-form'

type UnionFormProps = Readonly<{
  action: FormAction
  members: readonly SelectOption[]
  initialValues: UnionFormValues
  submit: SubmitLabels
}>

type FieldsProps = Readonly<{
  members: readonly SelectOption[]
  values: UnionFormValues
  errorOf: (name: string) => string | undefined
}>

/** Creates or edits a union; after an error, the form keeps what was chosen. */
export function UnionForm({ action, members, initialValues, submit }: UnionFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  const values = { ...initialValues, ...state.values }
  const errorOf = (name: string) => state.fieldErrors?.[name]?.[0]
  return (
    <form action={formAction} noValidate className="max-w-2xl space-y-6">
      <FormErrorSummary state={state} fields={UNION_FORM_FIELDS} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <ParentFields {...{ members, values, errorOf }} />
      <TypeAndDateFields {...{ members, values, errorOf }} />
      <Button type="submit" loading={pending}>
        {pending ? submit.pendingLabel : submit.label}
      </Button>
    </form>
  )
}

function ParentFields({ members, values, errorOf }: FieldsProps) {
  return (
    <>
      <SelectField
        {...PARENT1_FIELD}
        options={members}
        error={errorOf(PARENT1_FIELD.name)}
        defaultValue={values.parent1Id}
      />
      <SelectField
        {...PARENT2_FIELD}
        options={members}
        error={errorOf(PARENT2_FIELD.name)}
        defaultValue={values.parent2Id}
      />
    </>
  )
}

function TypeAndDateFields({ values, errorOf }: FieldsProps) {
  const date = { hint: DATE_HINT, months: MONTH_OPTIONS, values }
  return (
    <>
      <RadioGroupField
        {...UNION_TYPE_FIELD}
        options={UNION_TYPE_OPTIONS}
        error={errorOf(UNION_TYPE_FIELD.name)}
        defaultValue={values.type}
      />
      <PartialDateField {...START_DATE_FIELD} {...date} error={errorOf(START_DATE_FIELD.name)} />
      <PartialDateField {...END_DATE_FIELD} {...date} error={errorOf(END_DATE_FIELD.name)} />
    </>
  )
}
