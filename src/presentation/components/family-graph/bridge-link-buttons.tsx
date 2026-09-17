'use client'

import { useCrossTreeBranchContext } from '@/presentation/components/family-graph/cross-tree-branch-context'
import type { BridgeLink } from '@/presentation/graph/family-graph-types'
import { BRIDGE_BUTTONS_HEIGHT } from '@/presentation/graph/graph-dimensions'

const BUTTON_CLASS_NAMES = [
  'pointer-events-auto rounded-full border border-forest-light px-2 text-xs font-semibold',
  'text-forest disabled:opacity-70',
]

/** One toggle per tree this member bridges into (module 3.3); outside the card's own link. */
export function BridgeLinkButtons({ links }: Readonly<{ links: readonly BridgeLink[] }>) {
  const { pendingLinkId } = useCrossTreeBranchContext()
  return (
    <div
      style={{ height: BRIDGE_BUTTONS_HEIGHT }}
      className="pointer-events-none flex flex-wrap items-center justify-center gap-1 py-1"
    >
      {links.map((link) => (
        <BridgeLinkButton key={link.linkId} link={link} pending={pendingLinkId === link.linkId} />
      ))}
    </div>
  )
}

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
      <span aria-hidden="true">
        ↗ {link.treeName} {pending ? '…' : link.expanded ? '−' : '+'}
      </span>
    </button>
  )
}
