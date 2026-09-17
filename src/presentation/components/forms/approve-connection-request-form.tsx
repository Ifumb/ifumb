'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type ApproveConnectionRequestFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  itemLabel: string
}>

/** Same reasoning as `AcceptSuggestionForm`: on success the row leaves the PENDING list. */
export function ApproveConnectionRequestForm({
  action,
  itemLabel,
}: ApproveConnectionRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" loading={pending} aria-label={`Approuver la connexion avec ${itemLabel}`}>
        {pending ? 'Traitement…' : 'Approuver'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
