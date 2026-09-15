import type { AuditDiff, AuditSnapshot, AuditValue } from '@/core/entities/audit-change'
import type { Family } from '@/core/entities/family'
import type { Filiation, Union } from '@/core/entities/union'
import type { MemberId } from '@/core/shared/value-objects/member-id'

/** The current full name of a member of the family, as the history records people. */
export function nameIn(family: Family, id: MemberId | null): string | null {
  return id ? (family.findMember(id)?.fullName ?? null) : null
}

/** A union as the history records it: people by name, as the legacy app did, dates as text. */
function snapshotOf(union: Union, family: Family): Record<string, AuditValue> {
  return {
    type: union.type,
    parent1Name: nameIn(family, union.parent1Id),
    parent2Name: nameIn(family, union.parent2Id),
    startDate: union.startDate?.toString() ?? null,
    endDate: union.endDate?.toString() ?? null,
  }
}

const filled = (snapshot: AuditSnapshot): AuditSnapshot =>
  Object.fromEntries(Object.entries(snapshot).filter(([, value]) => value !== null))

export function unionCreationDiff(union: Union, family: Family): AuditDiff {
  return { before: null, after: filled(snapshotOf(union, family)) }
}

/**
 * reason: the legacy app recorded only the type before and the whole submission after, so dates
 * that did not change appeared as changed. Only the fields that differ are kept.
 */
export function unionRevisionDiff(before: Union, after: Union, family: Family): AuditDiff {
  const [previous, next] = [snapshotOf(before, family), snapshotOf(after, family)]
  const fields = Object.keys(next).filter((field) => previous[field] !== next[field])
  return {
    before: Object.fromEntries(fields.map((field) => [field, previous[field] ?? null])),
    after: Object.fromEntries(fields.map((field) => [field, next[field] ?? null])),
  }
}

/** reason: deleting a union unlinks its children too; the legacy entry did not say which. */
export function unionDeletionDiff(union: Union, family: Family): AuditDiff {
  const names = union.children.map(({ childId }) => nameIn(family, childId)).filter(Boolean)
  const childrenNames = names.length > 0 ? names.join(', ') : null
  return { before: filled({ ...snapshotOf(union, family), childrenNames }), after: null }
}

export function childLinkDiff(
  change: 'added' | 'removed',
  childName: string,
  filiation: Filiation,
): AuditDiff {
  return change === 'added'
    ? { before: null, after: { addedChildName: childName, filiation } }
    : { before: { removedChildName: childName, filiation }, after: null }
}
