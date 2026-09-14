import { FieldError } from '@/presentation/components/forms/field-error'
import { fieldId } from '@/presentation/components/forms/text-field'

type RadioOption = { readonly value: string; readonly label: string; readonly hint: string }

type RadioGroupFieldProps = Readonly<{
  name: string
  label: string
  options: readonly RadioOption[]
  error?: string
  defaultValue?: string
}>

/**
 * Native radio buttons in a fieldset: the legend names the group, each hint is read with its
 * choice. The first input carries the field id, so the error summary can link to the group.
 */
export function RadioGroupField({
  name,
  label,
  options,
  error,
  defaultValue,
}: RadioGroupFieldProps) {
  const errorId = `${fieldId(name)}-error`
  return (
    <fieldset className="space-y-2" aria-describedby={error ? errorId : undefined}>
      <legend className="font-medium">{label}</legend>
      {options.map((option, index) => (
        <RadioChoice
          key={option.value}
          name={name}
          option={option}
          first={index === 0}
          checked={option.value === defaultValue}
        />
      ))}
      {error && <FieldError id={errorId} message={error} />}
    </fieldset>
  )
}

type RadioChoiceProps = Readonly<{
  name: string
  option: RadioOption
  first: boolean
  checked: boolean
}>

function RadioChoice({ name, option, first, checked }: RadioChoiceProps) {
  const id = first ? fieldId(name) : `${fieldId(name)}-${option.value}`
  return (
    <div className="flex items-start gap-3 rounded-md border border-earth-sand bg-white p-3">
      <input
        {...{ id, name }}
        type="radio"
        value={option.value}
        defaultChecked={checked}
        aria-describedby={`${id}-hint`}
        className="mt-1 size-5 accent-brand-dark"
      />
      <ChoiceLabel inputId={id} option={option} />
    </div>
  )
}

/** The label names the choice; its hint stays apart, read as the choice's description. */
function ChoiceLabel({ inputId, option }: Readonly<{ inputId: string; option: RadioOption }>) {
  return (
    <div className="space-y-0.5">
      <label htmlFor={inputId} className="block font-medium">
        {option.label}
      </label>
      <p id={`${inputId}-hint`} className="text-sm text-earth-bark">
        {option.hint}
      </p>
    </div>
  )
}
