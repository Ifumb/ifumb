import { fieldId } from '@/presentation/components/forms/text-field'

type CheckboxFieldProps = Readonly<{ name: string; label: string; defaultChecked: boolean }>

/** A native checkbox, submitted as `on` when checked; its label is the clickable text. */
export function CheckboxField({ name, label, defaultChecked }: CheckboxFieldProps) {
  const id = fieldId(name)
  return (
    <div className="flex min-h-11 items-center gap-3">
      <input
        {...{ id, name, defaultChecked }}
        type="checkbox"
        className="size-5 accent-brand-dark"
      />
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
    </div>
  )
}
