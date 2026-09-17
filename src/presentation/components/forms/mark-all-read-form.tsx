'use client'

import { useActionState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type MarkAllReadFormProps = Readonly<{ action: () => Promise<FormState>; hasUnread: boolean }>

/**
 * Stays mounted even once hasUnread turns false (see notifications-view.tsx): only the button
 * hides then, so the confirmation message set by the very action that caused that isn't torn
 * down with it.
 */
export function MarkAllReadForm({ action, hasUnread }: MarkAllReadFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="flex items-center gap-3">
      {hasUnread && (
        <Button type="submit" variant="secondary" loading={pending}>
          {pending ? 'Marquage…' : 'Tout marquer comme lu'}
        </Button>
      )}
      {state.status === 'success' && <span role="status">{state.message}</span>}
    </form>
  )
}
