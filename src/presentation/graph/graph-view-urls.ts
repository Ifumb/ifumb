import type { LineageDepth } from '@/core/entities/lineage'
import { GRAPH_VIEW_PARAMS as P } from '@/presentation/schemas/graph-view-schema'

export type GraphHref = `/tree/${string}/graph` | `/tree/${string}/graph?${string}`

export function graphHref(treeId: string): GraphHref {
  return `/tree/${treeId}/graph`
}

export function lineageHref(treeId: string, memberId: string, depth: LineageDepth): GraphHref {
  const query = new URLSearchParams({
    [P.view]: 'lineage',
    [P.member]: memberId,
    [P.ancestors]: String(depth.ancestors),
    [P.descendants]: String(depth.descendants),
  })
  return `/tree/${treeId}/graph?${query.toString()}`
}
