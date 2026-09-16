import type { AuditDiff, AuditSnapshot, AuditValue } from '@/core/entities/audit-change'
import type { Union } from '@/core/entities/union'

/**
 * A union's own field values, fit to be replayed by an approval later — unlike `union-audit.ts`,
 * which resolves parent names for a human-readable history entry, this keeps the raw ids a
 * proposal needs. Members need no equivalent here: `Member.recordedValues` already holds raw,
 * replayable values, so `memberCreationDiff`/`memberRevisionDiff`/`memberDeletionDiff` from
 * `member-audit.ts` serve proposals and the audit log alike.
 */
function rawUnionValues(union: Union): Readonly<Record<string, AuditValue>> {
  return {
    type: union.type,
    parent1Id: union.parent1Id?.value ?? null,
    parent2Id: union.parent2Id?.value ?? null,
    startDate: union.startDate?.toString() ?? null,
    endDate: union.endDate?.toString() ?? null,
  }
}

const filled = (snapshot: Readonly<Record<string, AuditValue>>): AuditSnapshot =>
  Object.fromEntries(Object.entries(snapshot).filter(([, value]) => value !== null))

export function unionProposalCreationSnapshot(union: Union): AuditDiff {
  return { before: null, after: filled(rawUnionValues(union)) }
}

/** reason: only the fields that actually differ are kept, as `memberRevisionDiff` already does. */
export function unionProposalRevisionSnapshot(before: Union, after: Union): AuditDiff {
  const [previous, next] = [rawUnionValues(before), rawUnionValues(after)]
  const fields = Object.keys(next).filter((field) => previous[field] !== next[field])
  return {
    before: Object.fromEntries(fields.map((field) => [field, previous[field] ?? null])),
    after: Object.fromEntries(fields.map((field) => [field, next[field] ?? null])),
  }
}

export function unionProposalDeletionSnapshot(union: Union): AuditDiff {
  return { before: filled(rawUnionValues(union)), after: null }
}
