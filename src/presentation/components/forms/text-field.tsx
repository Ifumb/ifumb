import { FieldError } from '@/presentation/components/forms/field-error'
import type { FormFieldConfig } from '@/presentation/forms/form-fields'

type TextFieldProps = FormFieldConfig & Readonly<{ error?: string; defaultValue?: string }>

const INPUT_CLASS_NAME = [
  'min-h-11 w-full rounded-md border border-earth-bark bg-white px-3 py-2',
  'aria-invalid:border-2 aria-invalid:border-brand-dark',
].join(' ')

/** Stable id of a field's input, also used by the error summary to link to it. */
export function fieldId(name: string): string {
  return `field-${name}`
}

// reason: above the 20-line guideline only because Prettier puts one JSX attribute per line; the
// label, input and error are one accessible unit, and splitting them would hide how they connect.
export function TextField({
  name,
  label,
  type = 'text',
  autoComplete,
  error,
  defaultValue,
}: TextFieldProps) {
  const inputId = fieldId(name)
  const errorId = `${inputId}-error`

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block font-medium">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={INPUT_CLASS_NAME}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}
