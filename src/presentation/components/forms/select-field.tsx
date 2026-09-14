import { FieldError } from '@/presentation/components/forms/field-error'
import { fieldId } from '@/presentation/components/forms/text-field'
import { LabelledSelect, type SelectOption } from '@/presentation/components/ui/labelled-select'

type SelectFieldProps = Readonly<{
  name: string
  label: string
  options: readonly SelectOption[]
  placeholder?: string
  error?: string
  defaultValue?: string
}>

/** A native select submitted with its form, its error read with it. */
export function SelectField({ error, ...select }: SelectFieldProps) {
  const id = fieldId(select.name)
  const errorId = `${id}-error`
  return (
    <div className="space-y-1">
      <LabelledSelect
        {...select}
        id={id}
        invalid={error !== undefined}
        describedBy={error ? errorId : undefined}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}
