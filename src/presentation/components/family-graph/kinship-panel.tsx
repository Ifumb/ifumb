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
import type { KinshipResultViewModel } from '@/presentation/mappers/kinship-view-models'

const ERROR_MESSAGE = 'Erreur lors du calcul du chemin. Réessayez.'

type KinshipPanelProps = Readonly<{ treeId: string; people: readonly SelectOption[] }>
type KinshipResponse = { readonly result: KinshipResultViewModel }

/** The legacy "Chemin de parenté" panel (module: graph tools parity): a floating popover that
 * computes and shows its result in place, never a page navigation. Puts the path forward on the
 * graph itself through the shared tool-emphasis context, the same role `FamilyGraphViewModel`'s
 * server-computed `emphasis` played for the page it replaces. */
export function KinshipPanel({ treeId, people }: KinshipPanelProps) {
  const { setEmphasis } = useGraphToolEmphasis()
  const [open, setOpen] = useState(false)
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')
  const [result, setResult] = useState<KinshipResultViewModel | null>(null)
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
      const response = await fetch(`/api/tree/${treeId}/graph/kinship?${params}`)
      if (!response.ok) {
        setError(ERROR_MESSAGE)
        return
      }
      const body = (await response.json()) as KinshipResponse
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
        id="tour-btn-kinship"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={[
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-sm transition-colors',
          open
            ? 'border-brand bg-brand text-white'
            : 'border-earth-sand bg-white text-gray-700 hover:bg-gray-50',
        ].join(' ')}
      >
        <Icon name="branch" size={13} />
        Chemin
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="region"
            aria-label="Chemin de parenté"
            style={{ top: position.top, right: position.right, maxHeight: position.maxHeight }}
            className="fixed z-30 w-72 space-y-3 overflow-y-auto rounded-xl border border-earth-sand bg-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Icon name="branch" size={14} className="text-brand" />
                Chemin de parenté
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
                id="kinship-first"
                label="Membre A"
                placeholder="— Choisir —"
                options={people.filter((person) => person.value !== secondId)}
                value={firstId}
                onChange={(value) => selectMember('first', value)}
              />
              <GraphToolSelect
                id="kinship-second"
                label="Membre B"
                placeholder="— Choisir —"
                options={people.filter((person) => person.value !== firstId)}
                value={secondId}
                onChange={(value) => selectMember('second', value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={!canSearch || loading}
                onClick={search}
              >
                {loading ? 'Calcul…' : 'Calculer'}
              </Button>
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
                <div className="space-y-0.5 rounded-lg bg-earth-ivory px-3 py-2">
                  <p className="text-sm font-bold text-brand">{result.statement}</p>
                  {result.facts.map((fact) => (
                    <p key={fact.term} className="text-xs text-earth-bark">
                      {fact.term} : {fact.detail}
                    </p>
                  ))}
                </div>
                {result.path.length > 0 && (
                  <ol aria-label="Étapes du chemin" className="list-decimal space-y-1 pl-5 text-xs">
                    {result.path.map((person) => (
                      <li key={person.href} className="text-gray-700">
                        {person.name}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
