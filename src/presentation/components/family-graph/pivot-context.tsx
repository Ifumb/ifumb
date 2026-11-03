'use client'

import { createContext, useContext } from 'react'

export type PivotContextValue = {
  readonly activate: (memberId: string) => void
}

/**
 * React Flow's custom node components receive only `data`/`id` through `NodeProps`, never extra
 * props passed down the JSX tree — a context is how `MemberNode` reaches the pivot state
 * `FamilyGraphCanvas` owns, the same way `CrossTreeBranchContext` does for branch toggles.
 */
const PivotContext = createContext<PivotContextValue | null>(null)

export const PivotProvider = PivotContext.Provider

export function usePivotContext(): PivotContextValue {
  const value = useContext(PivotContext)
  if (!value) throw new Error('usePivotContext must be used within a PivotProvider')
  return value
}
