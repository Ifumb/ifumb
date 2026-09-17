'use client'

import { useActionState } from 'react'
import { LabelledSelect } from '@/presentation/components/ui/labelled-select'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'
import { ROLE_OPTIONS } from '@/presentation/forms/invitation-form'
import type { InvitationRole } from '@/core/entities/tree'

type ChangeRoleFormProps = Readonly<{ action: FormAction; role: InvitationRole; collaboratorName: string }>

/** One row of the collaborators list: a role select, submitted as soon as it changes. */
export function ChangeRoleForm({ action, role, collaboratorName }: ChangeRoleFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} className="flex items-center gap-2">
      <LabelledSelect
        id={`role-${collaboratorName}`}
        name="role"
        label={`Rôle de ${collaboratorName}`}
        options={ROLE_OPTIONS}
        defaultValue={role}
      />
      <Button type="submit" variant="secondary" loading={pending}>
        {pending ? 'Enregistrement…' : 'Changer'}
      </Button>
      {state.status === 'error' && (
        <p role="alert" className="text-brand-dark">
          {state.message}
        </p>
      )}
    </form>
  )
}
