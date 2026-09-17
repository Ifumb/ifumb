'use client'

import { createContext, useContext } from 'react'

export type CrossTreeBranchContextValue = {
  readonly expandedLinkIds: ReadonlySet<string>
  readonly pendingLinkId: string | null
  readonly onToggle: (linkId: string) => void
}

/**
 * React Flow's custom node components receive only `data`/`id` through `NodeProps`, never extra
 * props passed down the JSX tree — a context is how `MemberNode` reaches the branch-toggle state
 * `FamilyGraphCanvas` owns, without threading it through React Flow itself (module 3.3).
 */
const CrossTreeBranchContext = createContext<CrossTreeBranchContextValue | null>(null)

export const CrossTreeBranchProvider = CrossTreeBranchContext.Provider

export function useCrossTreeBranchContext(): CrossTreeBranchContextValue {
  const value = useContext(CrossTreeBranchContext)
  if (!value) throw new Error('useCrossTreeBranchContext must be used within a CrossTreeBranchProvider')
  return value
}
