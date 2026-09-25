'use client'

import { useState } from 'react'
import type { NodeChange, XYPosition } from '@xyflow/react'
import type { GraphNodeData } from '@/presentation/graph/family-graph-types'
import type { Node } from '@xyflow/react'

export function useGraphPositions() {
  const [positions, setPositions] = useState<Readonly<Record<string, XYPosition>>>({})
  const onNodesChange = (changes: NodeChange<Node<GraphNodeData>>[]) => {
    const moved = changes.filter((change) => change.type === 'position' && change.position)
    if (!moved.length) return
    setPositions((current) => {
      const next = { ...current }
      for (const change of moved) {
        if (change.type === 'position' && change.position) next[change.id] = change.position
      }
      return next
    })
  }
  return { positions, onNodesChange, reset: () => setPositions({}) }
}
