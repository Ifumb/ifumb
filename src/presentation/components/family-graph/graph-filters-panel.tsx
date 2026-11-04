'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { floatingPanelPosition } from '@/presentation/components/family-graph/floating-panel-position'
import { usePopoverDismissal } from '@/presentation/components/family-graph/use-popover-dismissal'
import { GraphToolSelect } from '@/presentation/components/family-graph/graph-tool-select'
import { Button } from '@/presentation/components/ui/button'
import { Icon } from '@/presentation/components/ui/icon'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
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

/** The legacy filter button, a toggle over a floating panel — not an inline accordion, so opening
 * it never pushes the other side tools down. The panel portals to `document.body`: the side-tools
 * stack it sits in scrolls (`overflow-y-auto`, for a tall stack on a short screen), which would
 * otherwise clip a panel positioned past that stack's own box. */
export function GraphFiltersPanel(props: GraphFiltersPanelProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 0, maxHeight: 0 })
  const count = activeFilterCount(props.filters)
  const close = useCallback(() => setOpen(false), [])

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    setPosition(floatingPanelPosition(buttonRef.current.getBoundingClientRect()))
  }, [open])

  usePopoverDismissal(open, buttonRef, panelRef, close)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        id="tour-btn-filters"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={[
          'flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-gray-50',
          count > 0 ? 'border-brand text-brand' : 'border-earth-sand text-gray-700',
        ].join(' ')}
      >
        Filtres
        {count > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-brand text-xs text-white">
            {count}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="region"
            aria-label="Filtres"
            style={{ top: position.top, right: position.right, maxHeight: position.maxHeight }}
            className="fixed z-30 w-60 space-y-3 overflow-y-auto rounded-xl border border-earth-sand bg-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Filtres</h3>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
            <FilterFieldset {...props} />
          </div>,
          document.body,
        )}
    </div>
  )
}

function FilterFieldset({ options, filters, onChange }: GraphFiltersPanelProps) {
  const count = activeFilterCount(filters)
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Filtrer les membres affichés</legend>
      {filterFields(options).map(({ key, ...field }) => (
        <GraphToolSelect
          key={key}
          id={`graph-filter-${key}`}
          {...field}
          value={filters[key]}
          onChange={(value) => onChange(withFilter(filters, key, value))}
        />
      ))}
      {count > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => onChange(NO_FILTERS)}
        >
          Réinitialiser les filtres
        </Button>
      )}
    </fieldset>
  )
}

/** Tribu is always offered, even with nothing to choose from — the same as the legacy panel.
 * The others are left out once there is nothing to filter by. */
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
  return fields.filter((field) => field.key === 'tribe' || field.options.length > 0)
}
