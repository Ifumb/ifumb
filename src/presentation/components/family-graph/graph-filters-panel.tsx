'use client'

import { Button } from '@/presentation/components/ui/button'
import { LabelledSelect, type SelectOption } from '@/presentation/components/ui/labelled-select'
import {
  activeFilterCount,
  GENDERS,
  NO_FILTERS,
  withFilter,
  type FilterOptions,
  type GraphFilters,
} from '@/presentation/graph/graph-filters'
import { GENDER_LABELS } from '@/presentation/labels/member-labels'

type GraphFiltersPanelProps = Readonly<{
  options: FilterOptions
  filters: GraphFilters
  onChange: (filters: GraphFilters) => void
}>

type FilterField = {
  readonly key: keyof GraphFilters
  readonly label: string
  readonly placeholder: string
  readonly options: readonly SelectOption[]
}

const GENDER_OPTIONS = GENDERS.map((gender) => ({ value: gender, label: GENDER_LABELS[gender] }))

export function GraphFiltersPanel(props: GraphFiltersPanelProps) {
  const count = activeFilterCount(props.filters)
  return (
    <details className="rounded-lg border border-earth-sand bg-white p-3">
      <summary id="tour-btn-filters" className="cursor-pointer font-semibold">
        Filtres{count > 0 && ` (${count} actif${count > 1 ? 's' : ''})`}
      </summary>
      <FilterFieldset {...props} />
    </details>
  )
}

function FilterFieldset({ options, filters, onChange }: GraphFiltersPanelProps) {
  return (
    <fieldset className="mt-3 flex flex-wrap items-end gap-4">
      <legend className="sr-only">Filtrer les membres affichés</legend>
      {filterFields(options).map(({ key, ...field }) => (
        <LabelledSelect
          key={key}
          id={`graph-filter-${key}`}
          {...field}
          value={filters[key]}
          onChange={(value) => onChange(withFilter(filters, key, value))}
        />
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange(NO_FILTERS)}>
        Réinitialiser les filtres
      </Button>
    </fieldset>
  )
}

/** The filters worth offering: a filter with nothing to choose from is left out. */
// reason: la table de configuration réunit les quatre facettes sans multiplier les composants.
function filterFields(options: FilterOptions): FilterField[] {
  const asOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }))
  const generations = options.generations.length > 1 ? options.generations : []
  const fields: FilterField[] = [
    { key: 'tribe', label: 'Tribu', placeholder: 'Toutes', options: asOptions(options.tribes) },
    {
      key: 'ethnicity',
      label: 'Ethnie',
      placeholder: 'Toutes',
      options: asOptions(options.ethnicities),
    },
    { key: 'gender', label: 'Genre', placeholder: 'Tous', options: GENDER_OPTIONS },
    {
      key: 'generation',
      label: 'Génération',
      placeholder: 'Toutes',
      options: generations.map((g) => ({ value: String(g), label: `Génération ${g + 1}` })),
    },
  ]
  return fields.filter((field) => field.options.length > 0)
}
