'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type DiscoverableToggleFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  discoverable: boolean
}>

/**
 * One button toggling `discoverable`; the confirmation swaps in as the label itself changes on the
 * next render, so no separate success message is needed — only a refusal is ever shown here.
 */
export function DiscoverableToggleForm({ action, discoverable }: DiscoverableToggleFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" loading={pending}>
        {pending ? 'Enregistrement…' : discoverable ? 'Retirer de la recherche' : 'Rendre découvrable'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
