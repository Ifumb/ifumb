import type { PendingBadge } from '@/presentation/graph/family-graph-types'

const BADGE_CLASS_NAMES = [
  'absolute -top-3 left-1 z-10 whitespace-nowrap rounded-full px-2 shadow-sm',
  'text-xs leading-5 font-semibold',
]

const TONE_CLASS_NAMES: Readonly<Record<PendingBadge['tone'], string>> = {
  pending: 'bg-accent-light text-foreground',
  deletion: 'bg-brand-dark text-earth-ivory',
}

/** A text marker, never colour alone, for a change waiting for review. */
export function PendingBadgeTag({ badge }: Readonly<{ badge: PendingBadge }>) {
  return (
    <span className={[...BADGE_CLASS_NAMES, TONE_CLASS_NAMES[badge.tone]].join(' ')}>
      {badge.label}
    </span>
  )
}
