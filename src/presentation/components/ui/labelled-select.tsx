import type { Ref } from 'react'

export type SelectOption = { readonly value: string; readonly label: string }

type LabelledSelectProps = Readonly<{
  id: string
  label: string
  /** The first, empty choice ("Toutes", "Choisir un membre"…). */
  placeholder: string
  options: readonly SelectOption[]
  /** Controlled use, in a Client Component. */
  value?: string
  onChange?: (value: string) => void
  /** Uncontrolled use, in a plain form submitted to the server. */
  name?: string
  defaultValue?: string
  /** Id of the message describing this field, such as its error. */
  describedBy?: string
  ref?: Ref<HTMLSelectElement>
}>

/** A native `<select>` with its visible `<label>`: keyboard and screen readers work as-is. */
export function LabelledSelect(props: LabelledSelectProps) {
  const { label, placeholder, options, onChange, describedBy, ...select } = props
  return (
    <div className="space-y-1">
      <label htmlFor={select.id} className="block font-medium">
        {label}
      </label>
      <select
        {...select}
        aria-describedby={describedBy}
        onChange={onChange && ((event) => onChange(event.target.value))}
        className="min-h-11 rounded-md border border-earth-bark bg-white px-3 py-2"
      >
        <option value="">{placeholder}</option>
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
