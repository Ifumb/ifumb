import type { Family } from '@/core/entities/family'
import type { Union } from '@/core/entities/union'

type Generations = Map<string, number>

/**
 * The generation of every member, counted from the members nobody descends from (generation 0).
 * Ported from the legacy graph service: the deepest line of descent wins, so that half-siblings
 * share a level, then the partners of a union are aligned on the deeper of the two.
 */
export function generationsOf(family: Family): ReadonlyMap<string, number> {
  const memberIds = family.members().map((member) => member.id.value)
  const unions = family.unions()
  const generations: Generations = new Map()
  // reason: no line of descent is longer than the family itself; a deeper generation can only come
  // from a cycle, which unvalidated legacy unions may contain, and would otherwise never end.
  const deepestPossible = Math.max(memberIds.length - 1, 0)

  propagate(generations, rootIds(memberIds, unions), unions, deepestPossible)
  alignPartners(generations, unions)
  return new Map(memberIds.map((id) => [id, generations.get(id) ?? 0]))
}

function rootIds(memberIds: readonly string[], unions: readonly Union[]): string[] {
  const childIds = new Set(unions.flatMap((union) => union.children.map((c) => c.childId.value)))
  return memberIds.filter((id) => !childIds.has(id))
}

function propagate(
  generations: Generations,
  roots: readonly string[],
  unions: readonly Union[],
  deepestPossible: number,
): void {
  const queue = roots.map((id) => ({ id, generation: 0 }))
  for (let item = queue.shift(); item; item = queue.shift()) {
    const { id, generation } = item
    if (generation > deepestPossible || (generations.get(id) ?? -1) >= generation) continue
    generations.set(id, generation)
    const next = generation + 1
    queue.push(...childIdsOf(id, unions).map((childId) => ({ id: childId, generation: next })))
  }
}

function childIdsOf(parentId: string, unions: readonly Union[]): string[] {
  return unions
    .filter((union) => union.parentIds.some((id) => id.value === parentId))
    .flatMap((union) => union.children.map((child) => child.childId.value))
}

function alignPartners(generations: Generations, unions: readonly Union[]): void {
  let changed = true
  while (changed) {
    changed = unions.map((union) => alignUnion(generations, union)).some(Boolean)
  }
}

/** Lifts the shallower partner to the generation of the deeper one; true when something moved. */
function alignUnion(generations: Generations, union: Union): boolean {
  const parentIds = union.parentIds.map((id) => id.value)
  const levels = parentIds.map((id) => generations.get(id) ?? 0)
  const deepest = Math.max(...levels, 0)
  const behind = parentIds.filter((_, index) => (levels[index] ?? 0) < deepest)
  behind.forEach((id) => generations.set(id, deepest))
  return behind.length > 0
}
