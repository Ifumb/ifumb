'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type RejectInvitationFormProps = Readonly<{ action: (previous: FormState) => Promise<FormState> }>

/** One button: on success the action redirects to the dashboard, so only a refusal ever shows here. */
export function RejectInvitationForm({ action }: RejectInvitationFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" loading={pending}>
        {pending ? 'Traitement…' : 'Rejeter'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
