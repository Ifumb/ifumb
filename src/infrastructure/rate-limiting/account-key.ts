import 'server-only'

/**
 * Rate-limit subject for an email as typed.
 * reason: accounts are looked up by exact match (legacy parity), but the attempt budget is keyed on
 * the trimmed, lower-cased form, so `Alice@x` and ` alice@x` share a budget and cannot multiply it.
 */
export function accountKey(email: string): string {
  return email.trim().toLowerCase()
}
