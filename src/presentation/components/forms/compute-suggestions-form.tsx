'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type ComputeSuggestionsFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
}>

/** The button stays on the page after a recompute (it never leaves its own list), so the result —
 * success or failure — is announced right here, not through a redirect. */
export function ComputeSuggestionsForm({ action }: ComputeSuggestionsFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" loading={pending}>
        {pending ? 'Calcul…' : 'Calculer les suggestions'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
      {state.status === 'success' && <p role="status">{state.message}</p>}
    </form>
  )
}
