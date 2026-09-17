'use client'

import { useActionState } from 'react'
import { sendContactRequestAction } from '@/app/actions/contact-request-actions'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { TextField } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'
import { CONTACT_REQUEST_ENTRIES } from '@/presentation/schemas/contact-request-schema'

const FIELDS = CONTACT_REQUEST_ENTRIES.map((name) => ({ name, label: 'Message (facultatif)' }))

type SendContactRequestFormProps = Readonly<{ memberId: string; memberName: string }>

/**
 * On success the page revalidates and this member's row shows its new status instead of this
 * button, so no confirmation message is needed here — only a refusal is ever shown by this form.
 */
export function SendContactRequestForm({ memberId, memberName }: SendContactRequestFormProps) {
  const [state, formAction, pending] = useActionState(
    sendContactRequestAction.bind(null, memberId),
    INITIAL_FORM_STATE,
  )
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <FormErrorSummary state={state} fields={FIELDS} />
      <TextField
        name="message"
        label="Message (facultatif)"
        autoComplete="off"
        required={false}
        defaultValue={state.values?.message}
        error={state.fieldErrors?.message?.[0]}
      />
      <Button type="submit" variant="secondary" loading={pending} aria-label={`Contacter ${memberName}`}>
        {pending ? 'Envoi…' : 'Contacter'}
      </Button>
    </form>
  )
}
