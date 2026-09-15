'use client'

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import Link from 'next/link'
import { PendingBadgeTag } from '@/presentation/components/family-graph/pending-badge-tag'
import type { UnionNodeData } from '@/presentation/graph/family-graph-types'
import { UNION_NODE_SIZE } from '@/presentation/graph/graph-dimensions'

type UnionFlowNode = Node<UnionNodeData, 'union'>

const UNION_CLASS_NAMES = [
  'relative flex items-center justify-center',
  'rounded-full border-2 border-brand-dark bg-earth-ivory text-brand-dark',
]

/**
 * A link to the union's page, named by its type and parents; the icon is decorative. A pending
 * change is written in the badge and repeated in the name.
 */
export function UnionNode({ data }: NodeProps<UnionFlowNode>) {
  return (
    <div style={UNION_NODE_SIZE} className={UNION_CLASS_NAMES.join(' ')}>
      {data.pending && <PendingBadgeTag badge={data.pending} />}
      <Handle type="target" position={Position.Top} isConnectable={false} className="invisible" />
      <Link href={data.href} aria-label={linkName(data)} className={LINK_CLASS_NAME}>
        <UnionIcon icon={data.icon} />
      </Link>
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

const ICON_PATHS: Readonly<Record<UnionNodeData['icon'], string>> = {
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  rings: 'M9 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z',
  branch: 'M12 4v16M12 12l-6-5M12 12l6-5',
}

function UnionIcon({ icon }: Readonly<{ icon: UnionNodeData['icon'] }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[icon]} />
    </svg>
  )
}
