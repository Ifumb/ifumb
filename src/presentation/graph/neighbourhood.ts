import type { GraphEdge } from '@/presentation/graph/family-graph-types'

/** Hops kept around a centred member: through a union to partners, parents and children. */
export const FOCUS_HOPS = 2

/** Nodes reachable from `startId` in at most `maxHops` steps, whatever the edge direction. */
export function nodesWithinHops(
  startId: string,
  maxHops: number,
  edges: readonly GraphEdge[],
): ReadonlySet<string> {
  const neighbours = adjacency(edges)
  const reached = new Set([startId])
  let frontier = [startId]
  for (let hop = 0; hop < maxHops && frontier.length > 0; hop += 1) {
    const next = new Set(frontier.flatMap((id) => neighbours.get(id) ?? []))
    frontier = [...next].filter((id) => !reached.has(id))
    frontier.forEach((id) => reached.add(id))
  }
  return reached
}

function adjacency(edges: readonly GraphEdge[]): ReadonlyMap<string, string[]> {
  const neighbours = new Map<string, string[]>()
  const link = (from: string, to: string) =>
    neighbours.set(from, [...(neighbours.get(from) ?? []), to])
  edges.forEach(({ source, target }) => {
    link(source, target)
    link(target, source)
  })
  return neighbours
}
