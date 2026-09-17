'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type AcceptSuggestionFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  itemLabel: string
}>

/** One button: on success the action redirects — this row leaves the NEW list that same request,
 * so only a refusal of the action itself is ever shown here (mirrors `ApproveChangeForm`). */
export function AcceptSuggestionForm({ action, itemLabel }: AcceptSuggestionFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" loading={pending} aria-label={`Accepter la correspondance avec ${itemLabel}`}>
        {pending ? 'Traitement…' : 'Accepter'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
