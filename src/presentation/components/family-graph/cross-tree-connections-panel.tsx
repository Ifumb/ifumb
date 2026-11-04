'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopoverDismissal } from '@/presentation/components/family-graph/use-popover-dismissal'
import { Icon } from '@/presentation/components/ui/icon'
import type { CrossTreeLinkItemViewModel } from '@/presentation/mappers/cross-tree-link-view-models'
import type { SuggestionItemViewModel } from '@/presentation/mappers/suggestion-view-models'

const COMPUTE_ERROR_MESSAGE = 'Erreur lors du calcul. Réessayez.'
const ACTION_ERROR_MESSAGE = 'Erreur inattendue.'

type ConnectionsResponse = {
  readonly suggestions: readonly SuggestionItemViewModel[]
  readonly links: readonly CrossTreeLinkItemViewModel[]
}

type CrossTreeConnectionsPanelProps = Readonly<{ treeId: string }>

function withoutKey(
  record: Readonly<Record<string, string>>,
  key: string,
): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key))
}

/**
 * The legacy "Connexions" panel (module: graph tools parity): a floating popover, brand-coloured
 * like Chemin and Ancêtres — see `kinship-panel.tsx`. Unlike those two, this one writes (compute,
 * accept, reject), so it only renders for a viewer who can contribute to the tree (`GraphToolsView`
 * decides that, not this component).
 */
export function CrossTreeConnectionsPanel({ treeId }: CrossTreeConnectionsPanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [computed, setComputed] = useState(false)
  const [suggestions, setSuggestions] = useState<readonly SuggestionItemViewModel[]>([])
  const [links, setLinks] = useState<readonly CrossTreeLinkItemViewModel[]>([])
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionErrors, setActionErrors] = useState<Readonly<Record<string, string>>>({})
  const [computeError, setComputeError] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 0 })

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }, [open])

  async function loadConnections() {
    const response = await fetch(`/api/tree/${treeId}/graph/connections`)
    if (!response.ok) return
    const body = (await response.json()) as ConnectionsResponse
    setSuggestions(body.suggestions)
    setLinks(body.links)
  }

  function toggle() {
    const opening = !open
    setOpen(opening)
    if (opening) void loadConnections()
  }

  async function compute() {
    setLoading(true)
    setComputeError(null)
    try {
      const response = await fetch(`/api/tree/${treeId}/graph/connections/compute`, {
        method: 'POST',
      })
      if (!response.ok) {
        setComputeError(COMPUTE_ERROR_MESSAGE)
        return
      }
      await loadConnections()
      setComputed(true)
    } catch {
      setComputeError(COMPUTE_ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }

  async function resolve(id: string, decision: 'accept' | 'reject') {
    setActionLoading(id)
    setActionErrors((errors) => withoutKey(errors, id))
    try {
      const response = await fetch(`/api/tree/${treeId}/graph/connections/${id}/${decision}`, {
        method: 'POST',
      })
      if (!response.ok) {
        setActionErrors((errors) => ({ ...errors, [id]: ACTION_ERROR_MESSAGE }))
        return
      }
      setDismissed((prev) => new Set([...prev, id]))
    } catch {
      setActionErrors((errors) => ({ ...errors, [id]: ACTION_ERROR_MESSAGE }))
    } finally {
      setActionLoading(null)
    }
  }

  const close = useCallback(() => {
    setOpen(false)
    setComputed(false)
    setSuggestions([])
    setDismissed(new Set())
    setActionErrors({})
    setComputeError(null)
  }, [])

  usePopoverDismissal(open, buttonRef, panelRef, close)

  const visible = suggestions.filter((suggestion) => !dismissed.has(suggestion.id))

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        id="tour-btn-connections"
        aria-expanded={open}
        onClick={toggle}
        className={[
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-sm transition-colors',
          open
            ? 'border-brand bg-brand text-white'
            : 'border-earth-sand bg-white text-gray-700 hover:bg-gray-50',
        ].join(' ')}
      >
        <Icon name="network" size={13} />
        Connexions
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="region"
            aria-label="Connexions inter-arbres"
            style={{ top: position.top, right: position.right }}
            className="fixed z-30 max-h-[70vh] w-80 space-y-3 overflow-y-auto rounded-xl border border-earth-sand bg-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Icon name="network" size={14} className="text-brand" />
                Connexions inter-arbres
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

            <button
              type="button"
              disabled={loading}
              onClick={compute}
              className="w-full rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Recherche…' : 'Chercher des connexions'}
            </button>
            {computeError && (
              <p role="alert" className="text-xs text-brand-dark">
                {computeError}
              </p>
            )}

            {links.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-gray-600 uppercase">
                  <Icon name="link" size={10} />
                  Liens établis
                </p>
                <ul aria-label="Liens établis" className="space-y-1.5">
                  {links.map((link) => (
                    <li
                      key={link.id}
                      className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-gray-700"
                    >
                      <span className="font-medium text-green-700">{link.ownMemberName}</span>
                      <span className="mx-1 text-gray-600">↔</span>
                      <span className="font-medium">{link.linkedMemberName}</span>
                      <div className="truncate text-[10px] text-gray-600">{link.linkedTreeName}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {computed && !loading && (
              <div>
                {visible.length === 0 ? (
                  <p className="py-2 text-center text-xs text-gray-500 italic">
                    Aucune correspondance trouvée.
                  </p>
                ) : (
                  <ul aria-label="Suggestions de connexion" className="space-y-2">
                    {visible.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        busy={actionLoading === suggestion.id}
                        error={actionErrors[suggestion.id]}
                        onAccept={() => resolve(suggestion.id, 'accept')}
                        onReject={() => resolve(suggestion.id, 'reject')}
                      />
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

type SuggestionCardProps = Readonly<{
  suggestion: SuggestionItemViewModel
  busy: boolean
  error: string | undefined
  onAccept: () => void
  onReject: () => void
}>

function SuggestionCard({ suggestion, busy, error, onAccept, onReject }: SuggestionCardProps) {
  return (
    <li className="space-y-2 rounded-lg bg-earth-ivory p-2.5">
      <div className="flex items-center justify-between gap-1">
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
          {suggestion.confidenceLabel}
        </span>
        <span className="truncate text-[10px] text-gray-600">{suggestion.targetTreeName}</span>
      </div>
      <p className="text-xs text-gray-700">
        <span className="font-medium text-gray-800">{suggestion.memberName}</span>
        <span className="mx-1 text-gray-600">↔</span>
        <span className="font-medium text-gray-800">{suggestion.targetMemberName}</span>
      </p>
      {error && (
        <p role="alert" className="text-[10px] text-brand-dark">
          {error}
        </p>
      )}
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="flex-1 rounded bg-green-700 px-2 py-1 text-[10px] text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? '…' : 'Accepter'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="flex-1 rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? '…' : 'Rejeter'}
        </button>
      </div>
    </li>
  )
}
