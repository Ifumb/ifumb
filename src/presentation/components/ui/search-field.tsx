import { SEARCH_TEXT_MAX_LENGTH } from '@/presentation/schemas/search-param-fields'

type SearchFieldProps = Readonly<{
  id: string
  name: string
  label: string
  defaultValue?: string
}>

/** A labelled search box for a plain GET form: the typed text ends up in the URL. */
export function SearchField({ id, name, label, defaultValue }: SearchFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="search"
        defaultValue={defaultValue}
        maxLength={SEARCH_TEXT_MAX_LENGTH}
        className="min-h-11 rounded-md border border-earth-bark bg-white px-3 py-2"
      />
    </div>
  )
}
