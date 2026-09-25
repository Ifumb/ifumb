'use client'

import { useCrossTreeBranchContext } from '@/presentation/components/family-graph/cross-tree-branch-context'
import type { BridgeLink } from '@/presentation/graph/family-graph-types'
import { BRIDGE_BUTTONS_HEIGHT } from '@/presentation/graph/graph-dimensions'

const BUTTON_CLASS_NAMES = [
  'nodrag pointer-events-auto min-h-11 max-w-full rounded border border-indigo-300 bg-indigo-100 px-2 text-xs font-semibold',
  'text-indigo-800 hover:bg-indigo-200 disabled:opacity-70',
]

/** One toggle per tree this member bridges into (module 3.3); outside the card's own link. */
export function BridgeLinkButtons({ links }: Readonly<{ links: readonly BridgeLink[] }>) {
  const { pendingLinkId } = useCrossTreeBranchContext()
  return (
    <div
      style={{ height: BRIDGE_BUTTONS_HEIGHT * links.length }}
      className="pointer-events-none flex flex-wrap items-center justify-center gap-1 py-1"
    >
      {links.map((link) => (
        <BridgeLinkButton key={link.linkId} link={link} pending={pendingLinkId === link.linkId} />
      ))}
    </div>
  )
}

// reason: le bouton conserve ensemble état de chargement, libellé accessible et activation.
function BridgeLinkButton({ link, pending }: Readonly<{ link: BridgeLink; pending: boolean }>) {
  const { onToggle } = useCrossTreeBranchContext()
  const label = link.expanded
    ? `Masquer la branche de ${link.treeName}`
    : `Afficher la branche de ${link.treeName}`
  return (
    <button
      type="button"
      aria-expanded={link.expanded}
      aria-busy={pending || undefined}
      aria-label={label}
      disabled={pending}
      onClick={() => onToggle(link.linkId)}
      className={BUTTON_CLASS_NAMES.join(' ')}
    >
      <span aria-hidden="true" className="block truncate">
        ↗ {link.treeName} {pending ? '…' : link.expanded ? '−' : '+'}
      </span>
    </button>
  )
}
