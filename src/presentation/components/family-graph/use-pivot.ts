'use client'

import { useState } from 'react'
import type {
  FamilyGraphViewModel,
  LineagePivotViewModel,
} from '@/presentation/graph/family-graph-types'
import { DEFAULT_LINEAGE_DEPTH, MAX_LINEAGE_GENERATIONS } from '@/presentation/schemas/graph-view-schema'

const PIVOT_ERROR_MESSAGE = 'Impossible d’afficher cette vue pour le moment.'

type LineageGraphResponse = {
  readonly graph: FamilyGraphViewModel
  readonly pivot: LineagePivotViewModel | null
}

export type PivotState = {
  readonly graph: FamilyGraphViewModel
  readonly pivot: LineagePivotViewModel | null
  readonly pending: boolean
  readonly error: string | null
  readonly activate: (memberId: string) => void
  readonly expandAncestors: () => void
  readonly expandDescendants: () => void
  readonly collapseDescendants: () => void
  readonly quit: () => void
}

/**
 * The pivot's generation window (ported from the legacy "pivot" banner, module: pivot parity):
 * each move asks the server for the scoped graph, already laid out — mirrors
 * `useCrossTreeBranches` — and caches the whole graph the page opened on so leaving a pivot
 * reached by clicking a card never needs a round trip. A real navigation (a new `graph` reference
 * from the server) resets to whatever the server opened on, the same way branches do.
 */
export function usePivot(
  graph: FamilyGraphViewModel,
  initialPivot: LineagePivotViewModel | null,
): PivotState {
  const [seenGraph, setSeenGraph] = useState(graph)
  const [displayGraph, setDisplayGraph] = useState(graph)
  const [wholeGraph, setWholeGraph] = useState(initialPivot ? null : graph)
  const [pivot, setPivot] = useState(initialPivot)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // reason: a real navigation hands down a brand-new `graph` reference — adjusted during render
  // (React's own pattern for resetting state derived from a prop), not in an effect, so it takes
  // effect before this render commits rather than triggering a second one right after.
  if (graph !== seenGraph) {
    setSeenGraph(graph)
    setDisplayGraph(graph)
    setWholeGraph(initialPivot ? null : graph)
    setPivot(initialPivot)
    setError(null)
  }

  async function request(memberId: string | null, ancestors: number, descendants: number) {
    setError(null)
    setPending(true)
    try {
      const params = new URLSearchParams()
      if (memberId) {
        params.set('member', memberId)
        params.set('up', String(ancestors))
        params.set('down', String(descendants))
      }
      const response = await fetch(`/api/tree/${graph.treeId}/graph/lineage?${params}`)
      if (!response.ok) {
        setError(PIVOT_ERROR_MESSAGE)
        return
      }
      const body = (await response.json()) as LineageGraphResponse
      setDisplayGraph(body.graph)
      setPivot(body.pivot)
      if (!memberId) setWholeGraph(body.graph)
    } catch {
      setError(PIVOT_ERROR_MESSAGE)
    } finally {
      setPending(false)
    }
  }

  return {
    graph: displayGraph,
    pivot,
    pending,
    error,
    activate(memberId) {
      void request(memberId, DEFAULT_LINEAGE_DEPTH.ancestors, DEFAULT_LINEAGE_DEPTH.descendants)
    },
    expandAncestors() {
      if (!pivot || pivot.ancestors >= MAX_LINEAGE_GENERATIONS) return
      void request(pivot.memberId, pivot.ancestors + 1, pivot.descendants)
    },
    expandDescendants() {
      if (!pivot || pivot.descendants >= MAX_LINEAGE_GENERATIONS) return
      void request(pivot.memberId, pivot.ancestors, pivot.descendants + 1)
    },
    collapseDescendants() {
      if (!pivot || pivot.deepestDescendantShown <= 0) return
      void request(pivot.memberId, pivot.ancestors, pivot.deepestDescendantShown - 1)
    },
    quit() {
      if (wholeGraph) {
        setDisplayGraph(wholeGraph)
        setPivot(null)
        return
      }
      void request(null, 0, 0)
    },
  }
}
