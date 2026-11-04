'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Form from 'next/form'
import { createPortal } from 'react-dom'
import { floatingPanelPosition } from '@/presentation/components/family-graph/floating-panel-position'
import { GraphToolSelect } from '@/presentation/components/family-graph/graph-tool-select'
import { usePopoverDismissal } from '@/presentation/components/family-graph/use-popover-dismissal'
import { Button } from '@/presentation/components/ui/button'
import { Icon } from '@/presentation/components/ui/icon'
import type { GraphToolsViewModel } from '@/presentation/mappers/graph-tools-view-models'
import { GRAPH_VIEW_PARAMS as P } from '@/presentation/schemas/graph-view-schema'

type LineageFormPanelProps = Readonly<{ tools: GraphToolsViewModel }>

/**
 * The "Descendance" entry point as the same kind of floating popover as Chemin, Ancêtres and
 * Connexions (module: mobile/keyboard parity) — it used to be the one remaining `<details>` tool,
 * with neither Escape nor outside-click dismissal, and a native `<select>` that took over the
 * whole screen on a phone. Submitting it is still a real navigation to a shareable URL (`tools.action`,
 * unchanged): only the shell and the member picker are now consistent with the other three.
 */
export function LineageFormPanel({ tools }: LineageFormPanelProps) {
  const [open, setOpen] = useState(tools.active === 'lineage')
  const [member, setMember] = useState(tools.selected.member ?? '')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 0, maxHeight: 0 })

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    setPosition(floatingPanelPosition(buttonRef.current.getBoundingClientRect()))
  }, [open])

  const close = useCallback(() => setOpen(false), [])
  usePopoverDismissal(open, buttonRef, panelRef, close)

  const errorId = tools.problem?.tool === 'lineage' ? 'lineage-problem' : undefined

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        id="tour-btn-lineage"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={[
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-sm transition-colors',
          open
            ? 'border-brand bg-brand text-white'
            : 'border-earth-sand bg-white text-gray-700 hover:bg-gray-50',
        ].join(' ')}
      >
        <Icon name="lineage" size={13} />
        Descendance
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="region"
            aria-label="Descendance"
            style={{ top: position.top, right: position.right, maxHeight: position.maxHeight }}
            className="fixed z-30 w-72 space-y-3 overflow-y-auto rounded-xl border border-earth-sand bg-white p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Icon name="lineage" size={14} className="text-brand" />
                Descendance
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

            <Form action={tools.action} className="space-y-3">
              <input type="hidden" name={P.view} value="lineage" />
              <input type="hidden" name={P.member} value={member} />
              <GraphToolSelect
                id="lineage-member"
                label="Membre"
                placeholder="Choisir un membre"
                options={tools.people}
                value={member}
                onChange={setMember}
                describedBy={errorId}
                invalid={tools.problem?.tool === 'lineage'}
              />
              <Button type="submit" variant="secondary" className="w-full">
                Voir la descendance
              </Button>
              {tools.problem?.tool === 'lineage' && (
                <p id={errorId} role="alert" className="font-semibold text-brand-dark">
                  {tools.problem.message}
                </p>
              )}
            </Form>
          </div>,
          document.body,
        )}
    </div>
  )
}
