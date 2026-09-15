import Image from 'next/image'
import type { PortraitViewModel } from '@/presentation/mappers/portrait'

type PortraitSize = 'md' | 'lg'

const SIZES_PX: Readonly<Record<PortraitSize, number>> = { md: 96, lg: 160 }

const FRAME_CLASS_NAME = 'shrink-0 rounded-full border-2 border-earth-sand object-cover'
const INITIAL_CLASS_NAME = [
  'grid place-items-center rounded-full border-2 border-earth-sand',
  'bg-earth-ivory font-bold text-brand-dark',
].join(' ')

type MemberPortraitProps = Readonly<{
  portrait: PortraitViewModel
  size: PortraitSize
  /** The largest image of the page: fetched first. */
  priority?: boolean
}>

/** The photo, described by its alternative text; without one, a decorative initial. */
export function MemberPortrait({ portrait, size, priority = false }: MemberPortraitProps) {
  const pixels = SIZES_PX[size]
  if (!portrait.src) return <Initial initial={portrait.initial} pixels={pixels} />
  return (
    <Image
      {...{ src: portrait.src, alt: portrait.alt, priority }}
      width={pixels}
      height={pixels}
      sizes={`${pixels}px`}
      style={{ width: pixels, height: pixels }}
      className={FRAME_CLASS_NAME}
    />
  )
}

function Initial({ initial, pixels }: Readonly<{ initial: string; pixels: number }>) {
  return (
    <span
      aria-hidden="true"
      style={{ width: pixels, height: pixels, fontSize: pixels / 2.5 }}
      className={INITIAL_CLASS_NAME}
    >
      {initial}
    </span>
  )
}
