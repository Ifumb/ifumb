'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type RejectSuggestionFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  itemLabel: string
}>

/** Same reasoning as `AcceptSuggestionForm`. */
export function RejectSuggestionForm({ action, itemLabel }: RejectSuggestionFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button
        type="submit"
        variant="secondary"
        loading={pending}
        aria-label={`Rejeter la suggestion avec ${itemLabel}`}
      >
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
