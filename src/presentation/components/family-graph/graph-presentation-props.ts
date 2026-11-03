import type { ReactNode } from 'react'
import type {
  FamilyGraphViewModel,
  LineagePivotViewModel,
} from '@/presentation/graph/family-graph-types'

export type FamilyGraphPresentationProps = Readonly<{
  graph: FamilyGraphViewModel
  tools?: ReactNode
  result?: ReactNode
  /** The pivot the page opened on, if any — null for the whole graph (module: pivot parity). */
  initialPivot?: LineagePivotViewModel | null
  actions?: ReactNode
  connections?: ReactNode
}>
