type DateFieldProps = Readonly<{
  id: string
  name: string
  label: string
  defaultValue?: string
}>

/** A native, labelled day picker for a plain GET form; its value is a `YYYY-MM-DD` day. */
export function DateField({ id, name, label, defaultValue }: DateFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="date"
        defaultValue={defaultValue}
        className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2"
      />
    </div>
  )
}
