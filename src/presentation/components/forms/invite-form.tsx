'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { SelectField } from '@/presentation/components/forms/select-field'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { TextField } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import {
  INVITE_EMAIL_FIELD,
  INVITE_FORM_FIELDS,
  INVITE_ROLE_FIELD,
  ROLE_OPTIONS,
  SEND_INVITATION_SUBMIT,
} from '@/presentation/forms/invitation-form'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'

type InviteFormProps = Readonly<{ action: FormAction }>

/** Invites a collaborator by email; the form keeps what was typed after a refusal. */
export function InviteForm({ action }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} noValidate className="max-w-xl space-y-4">
      <FormErrorSummary state={state} fields={INVITE_FORM_FIELDS} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <div className="flex flex-wrap items-end gap-4">
        <TextField
          {...INVITE_EMAIL_FIELD}
          error={state.fieldErrors?.email?.[0]}
          defaultValue={state.values?.email}
        />
        <SelectField {...INVITE_ROLE_FIELD} options={ROLE_OPTIONS} defaultValue={state.values?.role ?? 'EDITOR'} />
        <Button type="submit" loading={pending}>
          {pending ? SEND_INVITATION_SUBMIT.pendingLabel : SEND_INVITATION_SUBMIT.label}
        </Button>
      </div>
    </form>
  )
}
