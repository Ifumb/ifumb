import type { AuditDiff, AuditSnapshot } from '@/core/entities/audit-change'
import type { Member, MemberDetailChange } from '@/core/entities/member'

/** The fields a member has recorded: unset ones and an unticked "approximate" are left out. */
function filledValues(member: Member): AuditSnapshot {
  return Object.fromEntries(
    Object.entries(member.recordedValues).filter(([, value]) => value !== null && value !== false),
  )
}

export function memberCreationDiff(member: Member): AuditDiff {
  return { before: null, after: filledValues(member) }
}

/**
 * reason: the legacy app recorded the first and last names before and every submitted field
 * after, so its history showed fields as changed that were not. Only real changes are kept.
 */
export function memberRevisionDiff(changes: readonly MemberDetailChange[]): AuditDiff {
  return {
    before: Object.fromEntries(changes.map(({ field, before }) => [field, before])),
    after: Object.fromEntries(changes.map(({ field, after }) => [field, after])),
  }
}

export function memberDeletionDiff(member: Member): AuditDiff {
  return { before: filledValues(member), after: null }
}
