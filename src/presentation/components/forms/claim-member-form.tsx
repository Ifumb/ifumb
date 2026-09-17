'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type ClaimMemberFormProps = Readonly<{ action: (previous: FormState) => Promise<FormState> }>

/**
 * "This is me": on success the page revalidates and shows the member as claimed instead of this
 * button, so no confirmation message is needed here — only a refusal is ever shown by this form.
 */
export function ClaimMemberForm({ action }: ClaimMemberFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" loading={pending}>
        {pending ? 'Revendication…' : 'C’est moi ?'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
