import type { ReactNode } from 'react'
import type { FamilyGraphViewModel } from '@/presentation/graph/family-graph-types'

export type FamilyGraphPresentationProps = Readonly<{
  graph: FamilyGraphViewModel
  tools?: ReactNode
  result?: ReactNode
  actions?: ReactNode
  connections?: ReactNode
}>
