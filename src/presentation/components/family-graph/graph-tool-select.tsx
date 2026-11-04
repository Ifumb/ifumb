'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/presentation/components/ui/icon'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'

type GraphToolSelectProps = Readonly<{
  id: string
  label: string
  placeholder?: string
  options: readonly SelectOption[]
  value: string
  onChange: (value: string) => void
  describedBy?: string
  invalid?: boolean
}>

type ListboxPosition = {
  readonly left: number
  readonly width: number
  readonly maxHeight: number
  readonly top: number | undefined
  readonly bottom: number | undefined
}

const PREFERRED_LIST_HEIGHT = 240
const VIEWPORT_MARGIN = 8
const GAP = 4

/**
 * Opens downward from the button, as usual — unless the space below is cramped (phone-sized
 * viewport, a button low in a tall popover) and there is clearly more room above, in which case it
 * opens upward instead. Either way `maxHeight` is clamped to the room actually available, so the
 * list is never cut off by the edge of the screen.
 */
function listboxPosition(rect: DOMRect): ListboxPosition {
  const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN
  const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN
  const opensUp = spaceBelow < PREFERRED_LIST_HEIGHT / 2 && spaceAbove > spaceBelow
  const maxHeight = Math.max(100, Math.min(PREFERRED_LIST_HEIGHT, opensUp ? spaceAbove : spaceBelow))
  return opensUp
    ? { left: rect.left, width: rect.width, maxHeight, top: undefined, bottom: window.innerHeight - rect.top + GAP }
    : { left: rect.left, width: rect.width, maxHeight, top: rect.bottom + GAP, bottom: undefined }
}

/**
 * A custom listbox for the graph tool popovers (module: graph tools parity): the trigger button
 * and the list both have a fixed width of their own, instead of a native `<select>` sizing its
 * open list to its longest option — which can spill out past the popover that contains it. Follows
 * the ARIA "select-only combobox" pattern with roving `tabIndex` (each option is really focusable,
 * arrow keys move real focus between them) ; its API matches `LabelledSelect`'s controlled mode, so
 * it drops in without changing the forms that use it.
 */
export function GraphToolSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  describedBy,
  invalid,
}: GraphToolSelectProps) {
  const entries = placeholder !== undefined ? [{ value: '', label: placeholder }, ...options] : options
  const selectedIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.value === value),
  )
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const [position, setPosition] = useState<ListboxPosition>({
    left: 0,
    width: 0,
    maxHeight: PREFERRED_LIST_HEIGHT,
    top: 0,
    bottom: undefined,
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const listId = `${id}-listbox`
  const labelId = `${id}-label`

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    setPosition(listboxPosition(buttonRef.current.getBoundingClientRect()))
    setActiveIndex(selectedIndex)
    optionRefs.current[selectedIndex]?.focus()
    // reason: `value` (hence `selectedIndex`) only changes through `commit`, which closes the list
    // in the same call — so this never re-focuses while the list stays open and the person is
    // still arrow-navigating it (`activeIndex`, not `selectedIndex`, drives that).
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function commit(index: number) {
    onChange(entries[index]?.value ?? '')
    setOpen(false)
    buttonRef.current?.focus()
  }

  function moveTo(index: number) {
    const clamped = Math.min(Math.max(index, 0), entries.length - 1)
    setActiveIndex(clamped)
    optionRefs.current[clamped]?.focus()
  }

  function onButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
    }
  }

  function onOptionKeyDown(event: React.KeyboardEvent<HTMLDivElement>, index: number) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveTo(index + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveTo(index - 1)
        break
      case 'Home':
        event.preventDefault()
        moveTo(0)
        break
      case 'End':
        event.preventDefault()
        moveTo(entries.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        commit(index)
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
      default:
    }
  }

  const current = entries.find((entry) => entry.value === value)

  return (
    <div className="space-y-1">
      <span id={labelId} className="block font-medium">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${id}`}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className={[
          'flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left',
          invalid ? 'border-2 border-brand-dark' : '',
        ].join(' ')}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <Icon name="chevronDown" size={16} className="shrink-0 text-gray-500" />
      </button>
      {open &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            className="fixed z-40 overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
          >
            {entries.map((entry, index) => (
              <div
                key={entry.value}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                role="option"
                tabIndex={-1}
                aria-selected={entry.value === value}
                onKeyDown={(event) => onOptionKeyDown(event, index)}
                onClick={() => commit(index)}
                className={[
                  'cursor-pointer px-3 py-1.5 text-sm outline-none',
                  index === activeIndex ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                {entry.label}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
