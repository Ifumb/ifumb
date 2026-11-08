'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type VisibilityMaskToggleFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  masked: boolean
}>

/** One button toggling the visibility mask; mirrors `DiscoverableToggleForm`. */
export function VisibilityMaskToggleForm({ action, masked }: VisibilityMaskToggleFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" variant="secondary" loading={pending}>
        {pending
          ? 'Enregistrement…'
          : masked
            ? 'Rendre la fiche entièrement visible'
            : 'Masquer dates, lieux, photo et biographie'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
