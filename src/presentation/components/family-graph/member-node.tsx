'use client'

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import Image from 'next/image'
import Link from 'next/link'
import type { FocusEventHandler } from 'react'
import { BridgeLinkButtons } from '@/presentation/components/family-graph/bridge-link-buttons'
import { ForeignOriginTag } from '@/presentation/components/family-graph/foreign-origin-tag'
import { PendingBadgeTag } from '@/presentation/components/family-graph/pending-badge-tag'
import { usePanToFocusedNode } from '@/presentation/components/family-graph/use-pan-to-focused-node'
import type { MemberNodeData } from '@/presentation/graph/family-graph-types'
import { MEMBER_NODE_SIZE, memberNodeHeight } from '@/presentation/graph/graph-dimensions'

type MemberFlowNode = Node<MemberNodeData, 'member'>
type MemberDataProps = Readonly<{ data: MemberNodeData }>

const AVATAR_SIZE = 40

// reason: React Flow turns pointer events off on nodes that can be neither selected nor dragged;
// the link (or, for a foreign card, the card itself) restores them, or nothing inside could ever
// be reached with the keyboard.
const CARD_CLASS_NAMES = [
  'pointer-events-auto flex h-full w-full flex-col items-center justify-center gap-1 p-2',
  'rounded-lg border-2 border-earth-sand bg-white shadow-sm hover:border-brand-dark',
  'text-center text-foreground no-underline',
]

// A card merged in from another tree's branch (module 3.3): never a link, styled apart.
const FOREIGN_CARD_CLASS_NAMES = [
  'pointer-events-auto flex h-full w-full flex-col items-center justify-center gap-1 p-2',
  'rounded-lg border-2 border-forest-light bg-forest-light/10 shadow-sm',
  'cursor-default text-center text-foreground',
]

const GENERATION_TAG_CLASS_NAMES = [
  'absolute -top-3 right-1 z-10 whitespace-nowrap rounded-full px-2 shadow-sm',
  'bg-forest text-xs leading-5 font-semibold text-earth-ivory',
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
  const height = memberNodeHeight(data.bridgeLinks.length)

  return (
    <div
      style={{ width: MEMBER_NODE_SIZE.width, height }}
      className="relative flex flex-col items-stretch"
    >
      {data.foreign && <ForeignOriginTag treeName={data.foreign.treeName} />}
      {data.pending && <PendingBadgeTag badge={data.pending} />}
      {data.relativeGenerationLabel && (
        <RelativeGenerationTag label={data.relativeGenerationLabel} />
      )}
      <Handle type="target" position={Position.Top} isConnectable={false} className="invisible" />
      <div style={{ height: MEMBER_NODE_SIZE.height }}>
        <MemberCard data={data} onFocus={panToNode} />
      </div>
      {data.bridgeLinks.length > 0 && <BridgeLinkButtons links={data.bridgeLinks} />}
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
  if (data.foreign) {
    return (
      <div className={FOREIGN_CARD_CLASS_NAMES.join(' ')}>
        <MemberCardBody data={data} />
      </div>
    )
  }
  return (
    <Link href={data.href} onFocus={onFocus} className={CARD_CLASS_NAMES.join(' ')}>
      <MemberCardBody data={data} />
    </Link>
  )
}

function MemberCardBody({ data }: MemberDataProps) {
  return (
    <>
      <MemberAvatar data={data} />
      <span className="line-clamp-2 text-sm leading-tight font-semibold">{data.name}</span>
      {data.tribesLabel && (
        <span className="w-full truncate text-xs text-earth-bark">{data.tribesLabel}</span>
      )}
      <MemberDates data={data} />
    </>
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

function RelativeGenerationTag({ label }: Readonly<{ label: string }>) {
  return (
    <span className={GENERATION_TAG_CLASS_NAMES.join(' ')}>
      {label !== 'Pivot' && <span className="sr-only">Génération relative : </span>}
      {label}
    </span>
  )
}
