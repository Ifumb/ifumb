'use client'

import { usePivotContext } from '@/presentation/components/family-graph/pivot-context'
import { Icon } from '@/presentation/components/ui/icon'
import { PIVOT_BUTTON_HEIGHT } from '@/presentation/graph/graph-dimensions'

export function MemberPivotButton({
  memberId,
  name,
}: Readonly<{ memberId: string; name: string }>) {
  const { activate } = usePivotContext()
  return (
    <div style={{ height: PIVOT_BUTTON_HEIGHT }} className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => activate(memberId)}
        aria-label={`Voir la descendance de ${name}`}
        className="nodrag pointer-events-auto inline-flex min-h-11 items-center gap-1 rounded bg-violet-100 px-2 text-xs text-violet-800 hover:bg-violet-200"
      >
        <Icon name="descend" size={13} />
        Pivot
      </button>
    </div>
  )
}
