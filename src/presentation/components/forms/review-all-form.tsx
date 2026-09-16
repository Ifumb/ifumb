'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { TextAreaField } from '@/presentation/components/forms/text-area-field'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'
import type { PendingHref } from '@/presentation/mappers/pending-change-view-models'

type ReviewAllFormProps = Readonly<{
  action: (previous: FormState, formData: FormData) => Promise<FormState>
  submitLabel: string
  cancelHref: PendingHref
  /** Only a rejection carries a comment; the field is left out for an approval. */
  withComment: boolean
}>

const FIELDS = [{ name: 'comment', label: 'Commentaire' }]

/** The confirmation of a bulk decision: one explicit button, and a way back that changes nothing. */
export function ReviewAllForm({ action, submitLabel, cancelHref, withComment }: ReviewAllFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-4">
      <FormErrorSummary state={state} fields={withComment ? FIELDS : []} />
      {withComment && (
        <TextAreaField
          name="comment"
          label="Commentaire (facultatif, pour chacune)"
          defaultValue={state.values?.comment}
          error={state.fieldErrors?.comment?.[0]}
        />
      )}
      <div className="flex flex-wrap items-center gap-6">
        <Button type="submit" loading={pending}>
          {pending ? 'Traitement…' : submitLabel}
        </Button>
        <Link href={cancelHref}>Annuler et revenir aux propositions</Link>
      </div>
      {state.status === 'success' && <p role="status">{state.message}</p>}
    </form>
  )
}
