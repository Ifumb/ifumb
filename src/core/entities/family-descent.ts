import type { Family } from '@/core/entities/family'
import { childIdsOf } from '@/core/entities/family-links'
import type { MemberId } from '@/core/shared/value-objects/member-id'

/**
 * Whether `candidate` is `ancestor` or one of their descendants, following recorded children.
 * reason: the legacy check ran one query per step; the family is already loaded, so the walk
 * happens in memory. Visited members are skipped, which keeps inconsistent legacy data finite.
 */
export function isDescendantOrSelf(
  family: Family,
  candidate: MemberId,
  ancestor: MemberId,
): boolean {
  const visited = new Set<string>()
  const queue = [ancestor.value]
  for (let current = queue.shift(); current !== undefined; current = queue.shift()) {
    if (current === candidate.value) return true
    if (visited.has(current)) continue
    visited.add(current)
    queue.push(...childIdsOf(family, current))
  }
  return false
}
