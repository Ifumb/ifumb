'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type WithdrawContactRequestFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
}>

export function WithdrawContactRequestForm({ action }: WithdrawContactRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" loading={pending}>
        {pending ? 'Retrait…' : 'Retirer'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
