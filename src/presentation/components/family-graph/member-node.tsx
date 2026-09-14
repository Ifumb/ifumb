'use client'

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import Image from 'next/image'
import Link from 'next/link'
import type { FocusEventHandler } from 'react'
import { PendingBadgeTag } from '@/presentation/components/family-graph/pending-badge-tag'
import { usePanToFocusedNode } from '@/presentation/components/family-graph/use-pan-to-focused-node'
import type { MemberNodeData } from '@/presentation/graph/family-graph-types'
import { MEMBER_NODE_SIZE } from '@/presentation/graph/graph-dimensions'

type MemberFlowNode = Node<MemberNodeData, 'member'>
type MemberDataProps = Readonly<{ data: MemberNodeData }>

const AVATAR_SIZE = 40

const CARD_CLASS_NAMES = [
  'flex h-full flex-col items-center justify-center gap-1 p-2',
  'rounded-lg border-2 border-earth-sand bg-white shadow-sm hover:border-brand-dark',
  'text-center text-foreground no-underline',
]

const INITIAL_CLASS_NAMES = [
  'flex size-10 shrink-0 items-center justify-center rounded-full',
  'bg-earth-sand font-semibold text-earth-bark',
]

export function MemberNode({
  data,
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<MemberFlowNode>) {
  const panToNode = usePanToFocusedNode(positionAbsoluteX, positionAbsoluteY, MEMBER_NODE_SIZE)

  return (
    <div style={MEMBER_NODE_SIZE} className="relative">
      {data.pending && <PendingBadgeTag badge={data.pending} />}
      <Handle type="target" position={Position.Top} isConnectable={false} className="invisible" />
      <MemberCard data={data} onFocus={panToNode} />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="invisible"
      />
    </div>
  )
}

type MemberCardProps = MemberDataProps & Readonly<{ onFocus: FocusEventHandler<HTMLElement> }>

function MemberCard({ data, onFocus }: MemberCardProps) {
  return (
    <Link href={data.href} onFocus={onFocus} className={CARD_CLASS_NAMES.join(' ')}>
      <MemberAvatar data={data} />
      <span className="line-clamp-2 text-sm leading-tight font-semibold">{data.name}</span>
      {data.tribesLabel && (
        <span className="w-full truncate text-xs text-earth-bark">{data.tribesLabel}</span>
      )}
      <MemberDates data={data} />
    </Link>
  )
}

function MemberAvatar({ data }: MemberDataProps) {
  if (!data.photoSrc) {
    return (
      <span aria-hidden="true" className={INITIAL_CLASS_NAMES.join(' ')}>
        {data.initial}
      </span>
    )
  }
  return (
    <Image
      src={data.photoSrc}
      alt=""
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      sizes={`${AVATAR_SIZE}px`}
      className="size-10 shrink-0 rounded-full object-cover"
    />
  )
}

function MemberDates({ data }: MemberDataProps) {
  if (!data.lifespan && !data.approximate) return null
  return (
    <span className="text-xs text-earth-bark">
      {data.lifespan}
      {data.approximate && (
        <>
          <span aria-hidden="true"> ≈</span>
          <span className="sr-only"> (informations approximatives)</span>
        </>
      )}
    </span>
  )
}
