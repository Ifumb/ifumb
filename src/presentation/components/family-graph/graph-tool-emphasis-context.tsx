'use client'

import { createContext, useContext } from 'react'

export type GraphToolEmphasisContextValue = {
  /** Puts these node ids forward on the graph, dimming the rest; null clears it. */
  readonly setEmphasis: (ids: readonly string[] | null) => void
}

/**
 * A floating tool (Chemin, Ancêtres…) computes its result client-side and needs to tell the graph
 * which nodes to put forward — the same emphasis the server-rendered result used to carry on
 * `FamilyGraphViewModel.emphasis`, now set from a popover instead of a page navigation.
 */
const GraphToolEmphasisContext = createContext<GraphToolEmphasisContextValue | null>(null)

export const GraphToolEmphasisProvider = GraphToolEmphasisContext.Provider

export function useGraphToolEmphasis(): GraphToolEmphasisContextValue {
  const value = useContext(GraphToolEmphasisContext)
  if (!value) {
    throw new Error('useGraphToolEmphasis must be used within a GraphToolEmphasisProvider')
  }
  return value
}
