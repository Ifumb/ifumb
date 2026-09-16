import type { AuditSnapshot } from '@/core/entities/audit-change'

/**
 * Whether a proposal's "before" no longer matches the current state — approving it would then
 * silently overwrite a change made since it was proposed. Always false for a creation, which
 * records no "before" to compare against.
 */
export function isOutdated(before: AuditSnapshot | null, current: AuditSnapshot): boolean {
  if (!before) return false
  return Object.entries(before).some(([field, value]) => (current[field] ?? null) !== value)
}
