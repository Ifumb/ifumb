'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE, type FormState } from '@/presentation/forms/form-state'
import type { MemberHref } from '@/presentation/mappers/union-view-models'

type DeleteMemberFormProps = Readonly<{
  action: (previous: FormState) => Promise<FormState>
  cancelHref: MemberHref
}>

/** The confirmation of a deletion: one explicit button, and a way back that changes nothing. */
export function DeleteMemberForm({ action, cancelHref }: DeleteMemberFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="space-y-4">
      <FormErrorSummary state={state} fields={[]} />
      <div className="flex flex-wrap items-center gap-6">
        <Button type="submit" loading={pending}>
          {pending ? 'Suppression…' : 'Supprimer définitivement'}
        </Button>
        <Link href={cancelHref}>Annuler et revenir à la fiche</Link>
      </div>
    </form>
  )
}
