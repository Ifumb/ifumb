'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type ApproveChangeFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  itemLabel: string
}>

/**
 * One button: the proposal is applied as it stands, revalidated by the use case. On success the
 * action redirects — this item leaves the list that same request, so only a refusal is ever shown
 * here; the announcement for a success lives at the page level instead (see `review-schema.ts`).
 */
export function ApproveChangeForm({ action, itemLabel }: ApproveChangeFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-2">
      <Button type="submit" loading={pending} aria-label={`Approuver ${itemLabel}`}>
        {pending ? 'Approbation…' : 'Approuver'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
