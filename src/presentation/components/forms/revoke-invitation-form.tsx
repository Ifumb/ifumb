'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'

type RevokeInvitationFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  cancelHref: `/tree/${string}/collaborators`
}>

/** The confirmation of a revocation: one explicit button, and a way back that changes nothing. */
export function RevokeInvitationForm({ action, cancelHref }: RevokeInvitationFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-4">
      <FormErrorSummary state={state} fields={[]} />
      <div className="flex flex-wrap items-center gap-6">
        <Button type="submit" loading={pending}>
          {pending ? 'Révocation…' : 'Révoquer l’accès'}
        </Button>
        <Link href={cancelHref}>Annuler</Link>
      </div>
    </form>
  )
}
