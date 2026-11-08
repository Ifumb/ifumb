'use client'

import { useActionState } from 'react'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { TextAreaField } from '@/presentation/components/forms/text-area-field'
import { Button } from '@/presentation/components/ui/button'
import type { FormAction } from '@/presentation/forms/form-action'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'

const FIELD = { name: 'directive', label: 'Vos souhaits' } as const

type DeathDirectiveFormProps = Readonly<{ action: FormAction; initialDirective: string }>

// reason: formulaire autonome (un seul champ texte libre) plutot que d'etendre ActionForm pour
// un unique appelant - voir la meme logique pour RegisterForm.
export function DeathDirectiveForm({ action, initialDirective }: DeathDirectiveFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormErrorSummary state={state} fields={[FIELD]} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <TextAreaField
        name={FIELD.name}
        label={FIELD.label}
        hint="Visible par vous seul pour l'instant ; IFUMB n'agit pas encore automatiquement dessus."
        error={state.fieldErrors?.directive?.[0]}
        defaultValue={state.values?.directive ?? initialDirective}
      />
      <Button type="submit" loading={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
