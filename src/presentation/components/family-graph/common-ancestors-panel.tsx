'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { floatingPanelPosition } from '@/presentation/components/family-graph/floating-panel-position'
import { useGraphToolEmphasis } from '@/presentation/components/family-graph/graph-tool-emphasis-context'
import { GraphToolSelect } from '@/presentation/components/family-graph/graph-tool-select'
import { usePopoverDismissal } from '@/presentation/components/family-graph/use-popover-dismissal'
import { Button } from '@/presentation/components/ui/button'
import { Icon } from '@/presentation/components/ui/icon'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import type { CommonAncestorsViewModel } from '@/presentation/mappers/common-ancestors-view-models'

const ERROR_MESSAGE = 'Erreur lors du calcul. Réessayez.'

type CommonAncestorsPanelProps = Readonly<{ treeId: string; people: readonly SelectOption[] }>
type AncestorsResponse = { readonly result: CommonAncestorsViewModel }

/** The legacy "Ancêtres communs" panel (module: graph tools parity): a floating popover, sky-blue
 * like its legacy counterpart (Chemin de parenté stays brand-coloured) — see `kinship-panel.tsx`,
 * which this otherwise mirrors closely. */
export function CommonAncestorsPanel({ treeId, people }: CommonAncestorsPanelProps) {
  const { setEmphasis } = useGraphToolEmphasis()
  const [open, setOpen] = useState(false)
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const [result, setResult] = useState<CommonAncestorsViewModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 0, maxHeight: 0 })

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    setPosition(floatingPanelPosition(buttonRef.current.getBoundingClientRect()))
  }, [open])

  const canSearch = firstId !== '' && secondId !== '' && firstId !== secondId

  async function search() {
    if (!canSearch) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const params = new URLSearchParams({ first: firstId, second: secondId })
      const response = await fetch(`/api/tree/${treeId}/graph/ancestors?${params}`)
      if (!response.ok) {
        setError(ERROR_MESSAGE)
        return
      }
      const body = (await response.json()) as AncestorsResponse
      setResult(body.result)
      setEmphasis(body.result.emphasis)
    } catch {
      setError(ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }

  function selectMember(which: 'first' | 'second', value: string) {
    if (which === 'first') setFirstId(value)
    else setSecondId(value)
    setResult(null)
    setError(null)
    setEmphasis(null)
  }

  const reset = useCallback(() => {
    setFirstId('')
    setSecondId('')
    setResult(null)
    setError(null)
    setEmphasis(null)
  }, [setEmphasis])

  const close = useCallback(() => {
    reset()
    setOpen(false)
  }, [reset])

  usePopoverDismissal(open, buttonRef, panelRef, close)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        id="tour-btn-ancestors"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={[
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-sm transition-colors',
          open
            ? 'border-sky-700 bg-sky-700 text-white'
            : 'border-earth-sand bg-white text-gray-700 hover:bg-gray-50',
        ].join(' ')}
      >
        <Icon name="people" size={13} />
        Ancêtres
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="region"
            aria-label="Ancêtres communs"
            style={{ top: position.top, right: position.right, maxHeight: position.maxHeight }}
            className="fixed z-30 w-72 space-y-3 overflow-y-auto rounded-xl border border-earth-sand bg-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Icon name="people" size={14} className="text-sky-500" />
                Ancêtres communs
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size={15} />
              </button>
            </div>

            <div className="space-y-2">
              <GraphToolSelect
                id="ancestors-first"
                label="Membre A"
                placeholder="— Choisir —"
                options={people.filter((person) => person.value !== secondId)}
                value={firstId}
                onChange={(value) => selectMember('first', value)}
              />
              <GraphToolSelect
                id="ancestors-second"
                label="Membre B"
                placeholder="— Choisir —"
                options={people.filter((person) => person.value !== firstId)}
                value={secondId}
                onChange={(value) => selectMember('second', value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canSearch || loading}
                onClick={search}
                className="min-h-8 flex-1 rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Calcul…' : 'Calculer'}
              </button>
              {(result ?? firstId ?? secondId) && (
                <Button type="button" variant="secondary" size="sm" onClick={reset}>
                  Réinitialiser
                </Button>
              )}
            </div>

            {error && (
              <p role="alert" className="text-xs text-brand-dark">
                {error}
              </p>
            )}

            {result && (
              <div role="status" className="space-y-2">
                <p className="text-sm font-semibold text-gray-800">{result.statement}</p>
                {result.ancestors.length > 0 && (
                  <ul aria-label="Ancêtres communs" className="space-y-1.5">
                    {result.ancestors.map((ancestor) => (
                      <li key={ancestor.href} className="rounded-lg bg-earth-ivory px-2.5 py-2 text-xs">
                        <p className="font-semibold text-gray-800">{ancestor.name}</p>
                        <p className="text-gray-500">{ancestor.distances}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
