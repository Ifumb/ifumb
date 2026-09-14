'use client'

import { useReactFlow } from '@xyflow/react'
import { useCallback, useMemo, useState } from 'react'
import type { GraphEdge } from '@/presentation/graph/family-graph-types'
import { CENTRED_FIT, OVERVIEW_FIT } from '@/presentation/graph/graph-dimensions'
import { FOCUS_HOPS, nodesWithinHops } from '@/presentation/graph/neighbourhood'

const VIEW_DURATION_MS = 400

/** An animation length, or none when the visitor asked for reduced motion. */
export function transitionDuration(milliseconds: number): number {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : milliseconds
}

/** Centres the view on a member and their close relatives, and brings the overview back. */
export function useGraphCentring(edges: readonly GraphEdge[]) {
  const { fitView } = useReactFlow()
  const [centredId, setCentredId] = useState<string | null>(null)
  const inFocus = useMemo(() => neighbourhoodOf(centredId, edges), [centredId, edges])

  const centre = useCallback(
    (nodeId: string) => {
      setCentredId(nodeId)
      void fitView(centredFit(nodesWithinHops(nodeId, FOCUS_HOPS, edges)))
    },
    [edges, fitView],
  )

  const reset = useCallback(() => {
    setCentredId(null)
    void fitView({ ...OVERVIEW_FIT, duration: transitionDuration(VIEW_DURATION_MS) })
  }, [fitView])

  return { inFocus, centre, reset }
}

function centredFit(nodeIds: ReadonlySet<string>) {
  const nodes = [...nodeIds].map((id) => ({ id }))
  return { ...CENTRED_FIT, nodes, duration: transitionDuration(VIEW_DURATION_MS) }
}

function neighbourhoodOf(nodeId: string | null, edges: readonly GraphEdge[]) {
  return nodeId ? nodesWithinHops(nodeId, FOCUS_HOPS, edges) : null
}
