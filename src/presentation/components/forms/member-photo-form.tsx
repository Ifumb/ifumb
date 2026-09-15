'use client'

import { useActionState } from 'react'
import { FieldError } from '@/presentation/components/forms/field-error'
import { FieldHint } from '@/presentation/components/forms/field-hint'
import { FormErrorSummary } from '@/presentation/components/forms/form-error-summary'
import { StatusMessage } from '@/presentation/components/forms/status-message'
import { fieldId } from '@/presentation/components/forms/text-field'
import { Button } from '@/presentation/components/ui/button'
import { PHOTO_FIELD, PHOTO_HINT } from '@/presentation/errors/member-photo-messages'
import type { FormAction } from '@/presentation/forms/form-action'
import { INITIAL_FORM_STATE } from '@/presentation/forms/form-state'

type MemberPhotoFormProps = Readonly<{ action: FormAction; hasPhoto: boolean }>

const INPUT_CLASS_NAME = [
  'block w-full rounded-md border border-earth-bark bg-white p-2',
  'aria-invalid:border-2 aria-invalid:border-brand-dark',
].join(' ')

/**
 * Sends a new photo, or removes the current one. Both buttons belong to one form, so its outcome is
 * announced in a status region that stays on the page when the remove button goes away.
 */
export function MemberPhotoForm({ action, hasPhoto }: MemberPhotoFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE)
  return (
    <form action={formAction} noValidate className="max-w-xl space-y-4">
      <FormErrorSummary state={state} fields={[PHOTO_FIELD]} />
      <StatusMessage message={state.status === 'success' ? state.message : undefined} />
      <PhotoFileField error={state.fieldErrors?.[PHOTO_FIELD.name]?.[0]} />
      <div className="flex flex-wrap gap-4">
        <Button type="submit" name="intent" value="save" loading={pending}>
          {pending ? 'Envoi…' : 'Enregistrer la photo'}
        </Button>
        {hasPhoto && (
          <Button type="submit" name="intent" value="remove" variant="secondary" disabled={pending}>
            Retirer la photo
          </Button>
        )}
      </div>
    </form>
  )
}

function PhotoFileField({ error }: Readonly<{ error?: string }>) {
  const id = fieldId(PHOTO_FIELD.name)
  const [hintId, errorId] = [`${id}-hint`, `${id}-error`]
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {PHOTO_FIELD.label}
      </label>
      <FieldHint id={hintId} hint={PHOTO_HINT} />
      <input
        {...{ id, name: PHOTO_FIELD.name }}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={error ? true : undefined}
        className={INPUT_CLASS_NAME}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}
