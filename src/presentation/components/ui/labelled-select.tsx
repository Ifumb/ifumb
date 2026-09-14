import type { Ref } from 'react'

export type SelectOption = { readonly value: string; readonly label: string }

type LabelledSelectProps = Readonly<{
  id: string
  label: string
  /** The first, empty choice ("Toutes", "Choisir un membre"…). */
  placeholder: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  ref?: Ref<HTMLSelectElement>
}>

/** A native `<select>` with its visible `<label>`: keyboard and screen readers work as-is. */
export function LabelledSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
  ref,
}: LabelledSelectProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
