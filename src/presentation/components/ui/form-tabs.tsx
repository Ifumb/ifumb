'use client'

import { useId, type ReactNode, type KeyboardEvent } from 'react'

type FormTab = Readonly<{ label: string; content: ReactNode }>
type FormTabsProps = Readonly<{
  tabs: readonly FormTab[]
  selected: number
  onSelect: (index: number) => void
}>

// reason: les panneaux restent montés pour que tous les champs participent à FormData.
export function FormTabs({ tabs, selected, onSelect }: FormTabsProps) {
  const id = useId()
  return (
    <div className="form-tabs">
      <div
        role="tablist"
        aria-label="Informations du membre"
        className="flex border-b border-gray-200"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => moveTab(event, index, { count: tabs.length, onSelect })}
            className="flex-1 border-b-2 border-transparent px-2 py-2.5 text-sm text-gray-600 aria-selected:border-brand aria-selected:font-medium aria-selected:text-brand"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={selected !== index}
          className="pt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}

function moveTab(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  { count, onSelect }: Readonly<{ count: number; onSelect: (index: number) => void }>,
) {
  const next = {
    ArrowRight: (index + 1) % count,
    ArrowLeft: (index + count - 1) % count,
    Home: 0,
    End: count - 1,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  onSelect(next)
  const buttons =
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  buttons?.[next]?.focus()
}
