import type { Family } from '@/core/entities/family'
import { childIdsOf, parentIdsOf } from '@/core/entities/family-links'
import { MemberId } from '@/core/shared/value-objects/member-id'

export type LineageDepth = {
  /** Generations kept above the pivot. */
  readonly ancestors: number
  /** Generations kept below the pivot. */
  readonly descendants: number
}

export type Lineage = {
  /** Generation of each member kept, relative to the pivot (0); negative above it. */
  readonly relativeGenerations: ReadonlyMap<string, number>
  readonly unionIds: ReadonlySet<string>
  readonly hasDescendants: boolean
  readonly deepestDescendantShown: number
}

type Generations = Map<string, number>

/**
 * The pivot's line of descent (ported from the legacy "pivot" view): descendants and ancestors
 * within the requested depth, plus the co-parents of a kept child. Members are added once, so
 * cyclic data ends the walk.
 */
export function lineageOf(family: Family, pivotId: MemberId, depth: LineageDepth): Lineage {
  const pivot = pivotId.value
  const generations: Generations = new Map([[pivot, 0]])
  walk(generations, pivot, depth.descendants, (id) => childIdsOf(family, id), 1)
  walk(generations, pivot, depth.ancestors, (id) => parentIdsOf(family, id), -1)
  addCoParents(family, generations)
  return {
    relativeGenerations: generations,
    unionIds: keptUnionIds(family, generations),
    hasDescendants: childIdsOf(family, pivot).length > 0,
    deepestDescendantShown: Math.max(0, ...generations.values()),
  }
}

function walk(
  generations: Generations,
  pivot: string,
  maxDepth: number,
  next: (memberId: string) => string[],
  direction: 1 | -1,
): void {
  const queue = [{ id: pivot, depth: 0 }]
  for (let item = queue.shift(); item; item = queue.shift()) {
    if (item.depth >= maxDepth) continue
    for (const id of next(item.id)) {
      if (generations.has(id)) continue
      generations.set(id, direction * (item.depth + 1))
      queue.push({ id, depth: item.depth + 1 })
    }
  }
}

/** A partner is shown when a child they share with a kept member is kept too. */
function addCoParents(family: Family, generations: Generations): void {
  const kept = new Map(generations)
  for (const [memberId, generation] of kept) {
    for (const { partner, children } of family.partnerUnionsOf(MemberId.fromString(memberId))) {
      const sharesKeptChild = children.some(({ member }) => kept.has(member.id.value))
      if (partner && sharesKeptChild && !generations.has(partner.id.value)) {
        generations.set(partner.id.value, generation)
      }
    }
  }
}

function keptUnionIds(family: Family, generations: Generations): ReadonlySet<string> {
  const kept = (ids: readonly MemberId[]) => ids.some((id) => generations.has(id.value))
  const unions = family
    .unions()
    .filter((union) => kept(union.parentIds) && kept(union.children.map((c) => c.childId)))
  return new Set(unions.map((union) => union.id))
}
