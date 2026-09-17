'use client'

import { useState } from 'react'
import type { FamilyGraphViewModel } from '@/presentation/graph/family-graph-types'

const BRANCH_ERROR_MESSAGE = 'Impossible d’afficher cette branche pour le moment.'

type CrossTreeBranchesState = {
  readonly graph: FamilyGraphViewModel
  readonly expandedLinkIds: ReadonlySet<string>
  readonly pendingLinkId: string | null
  readonly error: string | null
  readonly toggle: (linkId: string) => void
}

/**
 * Merges zero or more foreign branches into the graph on demand (module 3.3): each toggle asks the
 * server for the local graph plus every currently expanded branch, already laid out as one graph —
 * layout never runs in the browser (see `layout-family-graph.ts`). A real navigation (a new `graph`
 * reference from the server) resets every expanded branch, the same way filters and centring do not
 * survive one either.
 */
export function useCrossTreeBranches(graph: FamilyGraphViewModel): CrossTreeBranchesState {
  const [seenGraph, setSeenGraph] = useState(graph)
  const [displayGraph, setDisplayGraph] = useState(graph)
  const [expandedLinkIds, setExpandedLinkIds] = useState<ReadonlySet<string>>(new Set())
  const [pendingLinkId, setPendingLinkId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // reason: a real navigation hands down a brand-new `graph` reference — adjusted during render
  // (React's own pattern for resetting state derived from a prop), not in an effect, so it takes
  // effect before this render commits rather than triggering a second one right after.
  if (graph !== seenGraph) {
    setSeenGraph(graph)
    setDisplayGraph(graph)
    setExpandedLinkIds(new Set())
    setError(null)
  }

  async function toggle(linkId: string) {
    const next = new Set(expandedLinkIds)
    if (next.has(linkId)) next.delete(linkId)
    else next.add(linkId)

    setError(null)
    setPendingLinkId(linkId)
    try {
      if (next.size === 0) {
        setDisplayGraph(graph)
        setExpandedLinkIds(next)
        return
      }
      const params = new URLSearchParams()
      for (const id of next) params.append('linkId', id)
      const response = await fetch(`/api/tree/${graph.treeId}/graph/branch?${params}`)
      if (response.status === 404) {
        // A link that no longer exists: drop it silently, like the rest of the graph would.
        next.delete(linkId)
        setExpandedLinkIds(next)
        return
      }
      if (!response.ok) {
        setError(BRANCH_ERROR_MESSAGE)
        return
      }
      setDisplayGraph((await response.json()) as FamilyGraphViewModel)
      setExpandedLinkIds(next)
    } catch {
      setError(BRANCH_ERROR_MESSAGE)
    } finally {
      setPendingLinkId(null)
    }
  }

  return { graph: displayGraph, expandedLinkIds, pendingLinkId, error, toggle }
}
