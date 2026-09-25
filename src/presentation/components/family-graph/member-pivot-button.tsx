'use client'

import { useRouter } from 'next/navigation'
import type { GraphHref } from '@/presentation/graph/graph-view-urls'
import { PIVOT_BUTTON_HEIGHT } from '@/presentation/graph/graph-dimensions'

export function MemberPivotButton({ href, name }: Readonly<{ href: GraphHref; name: string }>) {
  const router = useRouter()
  return (
    <div style={{ height: PIVOT_BUTTON_HEIGHT }} className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => router.push(href)}
        aria-label={`Voir la descendance de ${name}`}
        className="nodrag pointer-events-auto min-h-11 rounded bg-violet-100 px-2 text-xs text-violet-800 hover:bg-violet-200"
      >
        ⇓ Pivot
      </button>
    </div>
  )
}
