import type { Ref } from 'react'

const SELECT_CLASS_NAME = [
  'min-h-11 rounded-md border border-earth-bark bg-white px-3 py-2',
  'aria-invalid:border-2 aria-invalid:border-brand-dark',
].join(' ')

export type SelectOption = { readonly value: string; readonly label: string }

type LabelledSelectProps = Readonly<{
  id: string
  label: string
  /** The first, empty choice ("Toutes", "Choisir un membre"…); none when a choice is required. */
  placeholder?: string
  options: readonly SelectOption[]
  /** Controlled use, in a Client Component. */
  value?: string
  onChange?: (value: string) => void
  /** Uncontrolled use, in a plain form submitted to the server. */
  name?: string
  defaultValue?: string
  /** Id of the message describing this field, such as its error. */
  describedBy?: string
  invalid?: boolean
  ref?: Ref<HTMLSelectElement>
}>

/**
 * A native `<select>` with its visible `<label>`: keyboard and screen readers work as-is.
 * reason: the select is keyed by its default value. React applies `defaultValue` to a select only
 * when it mounts, so after a Server Action resets the form, the value echoed back would be lost.
 */
export function LabelledSelect(props: LabelledSelectProps) {
  const { label, placeholder, options, onChange, describedBy, invalid, ...select } = props
  return (
    <div className="space-y-1">
      <label htmlFor={select.id} className="block font-medium">
        {label}
      </label>
      <select
        key={select.defaultValue}
        {...select}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onChange={onChange && ((event) => onChange(event.target.value))}
        className={SELECT_CLASS_NAME}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(renderOption)}
      </select>
    </div>
  )
}

function renderOption({ value, label }: SelectOption) {
  return (
    <option key={value} value={value}>
      {label}
    </option>
  )
}
