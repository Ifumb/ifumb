import { FieldError } from '@/presentation/components/forms/field-error'
import { FieldHint } from '@/presentation/components/forms/field-hint'
import { fieldId } from '@/presentation/components/forms/text-field'
import { LabelledSelect, type SelectOption } from '@/presentation/components/ui/labelled-select'

type PartialDateFieldProps = Readonly<{
  /** Name of the whole date, under which its errors are reported. */
  name: string
  /** Prefix of the three entries: `birth` gives `birthDay`, `birthMonth` and `birthYear`. */
  prefix: string
  label: string
  hint: string
  months: readonly SelectOption[]
  values: Readonly<Record<string, string>>
  error?: string
}>

const PART_CLASS_NAME = [
  'min-h-11 rounded-md border border-earth-bark bg-white px-3 py-2',
  'aria-invalid:border-2 aria-invalid:border-brand-dark',
].join(' ')

/**
 * A date known to the year, the month or the day, typed in three fields grouped by a fieldset. The
 * day carries the date's id, so the error summary leads to the start of the group.
 */
export function PartialDateField({
  name,
  prefix,
  label,
  hint,
  error,
  ...parts
}: PartialDateFieldProps) {
  const id = fieldId(name)
  const [hintId, errorId] = [`${id}-hint`, `${id}-error`]
  const invalid = error !== undefined
  return (
    <fieldset className="space-y-2" aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}>
      <legend className="font-medium">{label}</legend>
      <FieldHint id={hintId} hint={hint} />
      <DateParts id={id} prefix={prefix} invalid={invalid} {...parts} />
      {error && <FieldError id={errorId} message={error} />}
    </fieldset>
  )
}

type DatePartsProps = Pick<PartialDateFieldProps, 'prefix' | 'months' | 'values'> &
  Readonly<{ id: string; invalid: boolean }>

function DateParts({ id, prefix, ...common }: DatePartsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <NumberPart {...common} id={id} name={`${prefix}Day`} label="Jour" size={2} />
      <MonthPart {...common} id={`${id}-month`} name={`${prefix}Month`} />
      <NumberPart {...common} id={`${id}-year`} name={`${prefix}Year`} label="Année" size={4} />
    </div>
  )
}

type PartProps = Readonly<{
  id: string
  name: string
  values: Readonly<Record<string, string>>
  invalid: boolean
}>

function NumberPart({
  id,
  name,
  label,
  size,
  values,
  invalid,
}: PartProps & { label: string; size: number }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <input
        {...{ id, name }}
        inputMode="numeric"
        maxLength={size}
        defaultValue={values[name]}
        aria-invalid={invalid || undefined}
        className={`${PART_CLASS_NAME} ${size === 2 ? 'w-16' : 'w-24'}`}
      />
    </div>
  )
}

function MonthPart({
  id,
  name,
  months,
  values,
  invalid,
}: PartProps & { months: readonly SelectOption[] }) {
  return (
    <LabelledSelect
      {...{ id, name, invalid }}
      label="Mois"
      placeholder="Inconnu"
      options={months}
      defaultValue={values[name]}
    />
  )
}
