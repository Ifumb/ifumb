import { FieldError } from '@/presentation/components/forms/field-error'
import { FieldHint } from '@/presentation/components/forms/field-hint'
import { fieldId } from '@/presentation/components/forms/text-field'

type TextAreaFieldProps = Readonly<{
  name: string
  label: string
  hint?: string
  error?: string
  defaultValue?: string
}>

const TEXT_AREA_CLASS_NAME = [
  'min-h-28 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
  'aria-invalid:border-2 aria-invalid:border-brand-dark',
].join(' ')

/** An optional multi-line field; its hint and error are read with it. */
// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function TextAreaField({ name, label, hint, error, defaultValue }: TextAreaFieldProps) {
  const id = fieldId(name)
  const [hintId, errorId] = [`${id}-hint`, `${id}-error`]
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  const invalid = error ? true : undefined
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {hint && <FieldHint id={hintId} hint={hint} />}
      <textarea
        {...{ id, name, defaultValue }}
        rows={4}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={TEXT_AREA_CLASS_NAME}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}
