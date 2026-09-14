/** The actions the audit log records, as stored by the legacy application. */
export const AUDIT_ACTIONS = [
  'MEMBER_CREATED',
  'MEMBER_UPDATED',
  'MEMBER_DELETED',
  'MEMBER_CLAIMED',
  'UNION_CREATED',
  'UNION_UPDATED',
  'UNION_DELETED',
  'INVITATION_SENT',
  'INVITATION_ACCEPTED',
  'INVITATION_REJECTED',
  'INVITATION_REVOKED',
  'ROLE_CHANGED',
  'TREE_CREATED',
  'TREE_UPDATED',
  'TREE_DELETED',
  'PENDING_CHANGE_APPROVED',
  'PENDING_CHANGE_REJECTED',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/** A value recorded in an audit diff: a JSON scalar. */
export type AuditValue = string | number | boolean | null

export type AuditSnapshot = Readonly<Record<string, AuditValue>>

export type AuditDiff = {
  readonly before: AuditSnapshot | null
  readonly after: AuditSnapshot | null
}

export type AuditFieldChange =
  | { readonly field: string; readonly kind: 'set'; readonly after: AuditValue }
  | { readonly field: string; readonly kind: 'removed'; readonly before: AuditValue }
  | {
      readonly field: string
      readonly kind: 'changed'
      readonly before: AuditValue
      readonly after: AuditValue
    }

/**
 * The fields an audit entry changed, in the order they were recorded.
 * reason: the legacy app often stored a partial `before` (two or three fields) next to a complete
 * `after`. A field is only "changed" when both sides recorded it; a field known on one side only
 * is reported as set or removed, never as changed from a value that was never recorded.
 */
export function describeAuditDiff({ before, after }: AuditDiff): AuditFieldChange[] {
  const previous = before ?? {}
  const next = after ?? {}
  const fields = [...new Set([...Object.keys(previous), ...Object.keys(next)])]
  return fields.flatMap((field) => changeOf(field, previous, next))
}

function changeOf(field: string, before: AuditSnapshot, after: AuditSnapshot): AuditFieldChange[] {
  const [inBefore, inAfter] = [Object.hasOwn(before, field), Object.hasOwn(after, field)]
  const [previous, next] = [before[field] ?? null, after[field] ?? null]
  if (inBefore && inAfter) {
    return previous === next ? [] : [{ field, kind: 'changed', before: previous, after: next }]
  }
  return inAfter
    ? [{ field, kind: 'set', after: next }]
    : [{ field, kind: 'removed', before: previous }]
}
