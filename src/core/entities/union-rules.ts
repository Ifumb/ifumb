import type { Family } from '@/core/entities/family'
import { isDescendantOrSelf } from '@/core/entities/family-descent'
import { datesInOrder } from '@/core/entities/member-dates'
import type { Union, UnionDetailsInput } from '@/core/entities/union'
import type { MemberId } from '@/core/shared/value-objects/member-id'

export type UnionDetailsProblem = 'PARENT_NOT_FOUND' | 'SAME_PARENT_TWICE' | 'END_BEFORE_START'

export type ChildLinkProblem =
  'CHILD_IS_PARENT' | 'ALREADY_CHILD' | 'FAMILY_CYCLE' | 'SAME_PARENTS_UNION_EXISTS'

/** The parents named by union details, the second one being optional. */
export function parentIdsIn(details: UnionDetailsInput): MemberId[] {
  return [details.parent1Id, details.parent2Id].filter((id): id is MemberId => id !== null)
}

/** What prevents these details from being written to a union of this family, if anything. */
export function unionDetailsProblem(
  family: Family,
  details: UnionDetailsInput,
): UnionDetailsProblem | null {
  const [first, second] = parentIdsIn(details)
  if ([first, second].some((id) => id && !family.findMember(id))) return 'PARENT_NOT_FOUND'
  if (second && first?.value === second.value) return 'SAME_PARENT_TWICE'
  return datesInOrder(details.startDate, details.endDate) ? null : 'END_BEFORE_START'
}

/** What prevents linking this member as a child of the union, if anything. */
export function childLinkProblem(
  family: Family,
  union: Union,
  childId: MemberId,
): ChildLinkProblem | null {
  if (union.hasParent(childId)) return 'CHILD_IS_PARENT'
  if (union.hasChild(childId)) return 'ALREADY_CHILD'
  if (union.parentIds.some((parent) => isDescendantOrSelf(family, parent, childId))) {
    return 'FAMILY_CYCLE'
  }
  return childOfSameParents(family, union, childId) ? 'SAME_PARENTS_UNION_EXISTS' : null
}

/** A cycle when a new parent is one of the union's children or descends from one of them. */
export function parentChangeProblem(
  family: Family,
  union: Union,
  parents: readonly MemberId[],
): 'FAMILY_CYCLE' | null {
  const cycle = parents.some((parent) =>
    union.children.some(({ childId }) => isDescendantOrSelf(family, parent, childId)),
  )
  return cycle ? 'FAMILY_CYCLE' : null
}

function childOfSameParents(family: Family, union: Union, childId: MemberId): boolean {
  if (union.parentIds.length < 2) return false
  const key = parentKey(union)
  return family
    .unions()
    .some((other) => other.id !== union.id && other.hasChild(childId) && parentKey(other) === key)
}

function parentKey(union: Union): string {
  return union.parentIds
    .map((id) => id.value)
    .sort()
    .join('|')
}
