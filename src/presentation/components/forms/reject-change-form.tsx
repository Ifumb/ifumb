'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { TextAreaField } from '@/presentation/components/forms/text-area-field'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type RejectChangeFormProps = Readonly<{
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  itemLabel: string
}>

const FIELDS = [{ name: 'comment', label: 'Commentaire' }]

/**
 * A comment, then the rejection — the author will see both on their own list. On success the
 * action redirects (see `ApproveChangeForm`); only a refusal is ever shown by this form itself.
 */
export function RejectChangeForm({ action, itemLabel }: RejectChangeFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <FormErrorSummary state={state} fields={FIELDS} />
      <TextAreaField
        name="comment"
        label="Commentaire (facultatif)"
        defaultValue={state.values?.comment}
        error={state.fieldErrors?.comment?.[0]}
      />
      <Button
        type="submit"
        variant="secondary"
        loading={pending}
        aria-label={`Rejeter ${itemLabel}`}
      >
        {pending ? 'Rejet…' : 'Rejeter'}
      </Button>
    </form>
  )
}
