'use client'

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import Link from 'next/link'
import { Icon, type IconName } from '@/presentation/components/ui/icon'
import { PendingBadgeTag } from '@/presentation/components/family-graph/pending-badge-tag'
import type { UnionNodeData } from '@/presentation/graph/family-graph-types'
import { UNION_NODE_SIZE } from '@/presentation/graph/graph-dimensions'

type UnionFlowNode = Node<UnionNodeData, 'union'>

const UNION_CLASS_NAMES = [
  'relative flex items-center justify-center',
  'rounded-full border-2 border-brand-dark bg-earth-ivory text-brand-dark',
]

// A union merged in from another tree's branch (module 3.3): styled apart, never a link.
const FOREIGN_UNION_CLASS_NAMES = [
  'relative flex items-center justify-center',
  'rounded-full border-2 border-forest-light bg-forest-light/10 text-forest',
]

/**
 * A link to the union's page, named by its type and parents; the icon is decorative. A pending
 * change is written in the badge and repeated in the name. A union merged in from a foreign branch
 * is never a link — the access this graph grants stops at this one view (module 3.3, decision 4).
 */
// reason: le JSX conserve ensemble les deux variantes accessibles, locale et étrangère.
export function UnionNode({ data }: NodeProps<UnionFlowNode>) {
  return (
    <div
      style={UNION_NODE_SIZE}
      className={(data.foreign ? FOREIGN_UNION_CLASS_NAMES : UNION_CLASS_NAMES).join(' ')}
    >
      {data.pending && <PendingBadgeTag badge={data.pending} />}
      <Handle type="target" position={Position.Top} isConnectable={false} className="invisible" />
      {data.foreign ? (
        <div role="img" aria-label={linkName(data)} className={LINK_CLASS_NAME}>
          <UnionIcon icon={data.icon} />
        </div>
      ) : (
        <Link href={data.href} aria-label={linkName(data)} className={LINK_CLASS_NAME}>
          <UnionIcon icon={data.icon} />
        </Link>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="invisible"
      />
    </div>
  )
}

// reason: pointer events are restored on the link, as on member cards (see member-node.tsx).
const LINK_CLASS_NAME = 'pointer-events-auto grid size-full place-items-center rounded-full'

function linkName({ label, pending }: UnionNodeData): string {
  const status = pending ? `, ${pending.label.toLocaleLowerCase('fr')}` : ''
  return `Voir l’union — ${label}${status}`
}

const UNION_ICONS: Readonly<Record<UnionNodeData['icon'], IconName>> = {
  heart: 'heart',
  rings: 'people',
  branch: 'dna',
}

function UnionIcon({ icon }: Readonly<{ icon: UnionNodeData['icon'] }>) {
  return <Icon name={UNION_ICONS[icon]} className="size-5" />
}
