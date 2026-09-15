'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { SelectField } from '@/presentation/components/forms/select-field'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { Button } from '@/presentation/components/ui/button'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import type { FormAction } from '@/presentation/forms/form-action'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'
import { CHILD_FIELD, FILIATION_FIELD, FILIATION_OPTIONS } from '@/presentation/forms/union-form'

type AddUnionChildFormProps = Readonly<{
  action: FormAction
  childOptions: readonly SelectOption[]
}>

/**
 * Links an existing member as a child; the outcome is announced, and errors lead to the field. The
 * form stays mounted once no member is left, so that the announcement of the last link remains.
 */
export function AddUnionChildForm({ action, childOptions }: AddUnionChildFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormErrorSummary state={state} fields={[CHILD_FIELD, FILIATION_FIELD]} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      {childOptions.length === 0 ? (
        <p>Tous les membres de l’arbre sont déjà liés à cette union.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <ChildFields state={state} childOptions={childOptions} />
          <Button type="submit" loading={pending}>
            {pending ? 'Ajout…' : 'Ajouter l’enfant'}
          </Button>
        </div>
      )}
    </form>
  )
}

type ChildFieldsProps = Readonly<{ state: FormState; childOptions: readonly SelectOption[] }>

function ChildFields({ state, childOptions }: ChildFieldsProps) {
  return (
    <>
      <SelectField
        {...CHILD_FIELD}
        options={childOptions}
        error={state.fieldErrors?.[CHILD_FIELD.name]?.[0]}
        defaultValue={state.values?.childId}
      />
      <SelectField
        {...FILIATION_FIELD}
        options={FILIATION_OPTIONS}
        defaultValue={state.values?.filiation ?? 'BIOLOGICAL'}
      />
    </>
  )
}
