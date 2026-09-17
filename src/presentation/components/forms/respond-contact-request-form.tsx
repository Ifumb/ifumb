'use client'

import { useActionState } from 'react'
import { Button, type ButtonVariant } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type RespondContactRequestFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  label: string
  pendingLabel: string
  variant: ButtonVariant
}>

/** One button (accept or refuse); on success the page revalidates and this row leaves the "en
 * attente" state, so only a refusal of the action itself is ever shown here. */
export function RespondContactRequestForm({
  action,
  label,
  pendingLabel,
  variant,
}: RespondContactRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant={variant} loading={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
