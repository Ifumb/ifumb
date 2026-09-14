import type { Family } from '@/core/entities/family'
import { parentIdsOf } from '@/core/entities/family-links'
import type { Member } from '@/core/entities/member'
import type { MemberId } from '@/core/shared/value-objects/member-id'

export type CommonAncestor = {
  readonly member: Member
  readonly distanceFromA: number
  readonly distanceFromB: number
}

/**
 * Ancestors both members descend from, the two members themselves excluded, nearest first.
 * Distances are generations; ties keep the family's name order.
 */
export function commonAncestorsOf(family: Family, aId: MemberId, bId: MemberId): CommonAncestor[] {
  const fromA = ancestorDistances(family, aId.value)
  const fromB = ancestorDistances(family, bId.value)
  const nearest = (ancestor: CommonAncestor) =>
    Math.min(ancestor.distanceFromA, ancestor.distanceFromB)

  return family
    .members()
    .flatMap((member) => {
      const id = member.id.value
      const [distanceFromA, distanceFromB] = [fromA.get(id), fromB.get(id)]
      if (id === aId.value || id === bId.value) return []
      if (distanceFromA === undefined || distanceFromB === undefined) return []
      return [{ member, distanceFromA, distanceFromB }]
    })
    .sort((a, b) => nearest(a) - nearest(b))
}

/** Breadth-first up the parents: each ancestor once, at its shortest distance, cycles included. */
function ancestorDistances(family: Family, startId: string): ReadonlyMap<string, number> {
  const distances = new Map([[startId, 0]])
  const queue = [startId]
  for (let current = queue.shift(); current !== undefined; current = queue.shift()) {
    const next = (distances.get(current) ?? 0) + 1
    for (const parentId of parentIdsOf(family, current)) {
      if (distances.has(parentId)) continue
      distances.set(parentId, next)
      queue.push(parentId)
    }
  }
  return distances
}
