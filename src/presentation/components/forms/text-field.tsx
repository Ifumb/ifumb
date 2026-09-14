import { FieldError } from '@/presentation/components/forms/field-error'
import type { FormFieldConfig } from '@/presentation/forms/form-fields'

type TextFieldProps = FormFieldConfig &
  Readonly<{ required?: boolean; error?: string; defaultValue?: string }>

const INPUT_CLASS_NAME = [
  'min-h-11 w-full rounded-md border border-earth-bark bg-white px-3 py-2',
  'aria-invalid:border-2 aria-invalid:border-brand-dark',
].join(' ')

/** Stable id of a field's input, also used by the error summary to link to it. */
export function fieldId(name: string): string {
  return `field-${name}`
}

/** A labelled text input; required unless the field says otherwise, its error read with it. */
export function TextField({
  name,
  label,
  type = 'text',
  required = true,
  ...rest
}: TextFieldProps) {
  const inputId = fieldId(name)
  const errorId = `${inputId}-error`
  const { autoComplete, error, defaultValue } = rest
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block font-medium">
        {label}
      </label>
      <input
        {...{ id: inputId, name, type, autoComplete, defaultValue, required }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={INPUT_CLASS_NAME}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}
