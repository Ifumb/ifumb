import 'server-only'
import type { RateLimitPolicy } from '@/infrastructure/rate-limiting/in-memory-rate-limiter'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

/**
 * Attempt budgets per flow and per key. Keys combine a network identity (IP) with an account
 * identity (email or user id), so rotating IPs does not bypass the per-account budget.
 */
export const RATE_LIMIT_POLICIES = {
  loginByIp: { limit: 20, windowMs: 15 * MINUTE_MS },
  loginByEmail: { limit: 5, windowMs: 15 * MINUTE_MS },
  registerByIp: { limit: 10, windowMs: HOUR_MS },
  passwordResetRequestByEmail: { limit: 3, windowMs: HOUR_MS },
  passwordResetRequestByIp: { limit: 10, windowMs: HOUR_MS },
  passwordResetByIp: { limit: 10, windowMs: 15 * MINUTE_MS },
  passwordChangeByUser: { limit: 5, windowMs: 15 * MINUTE_MS },
  // Anonymous public searches: generous for a person, a brake on bulk harvesting of public data.
  publicSearchByIp: { limit: 60, windowMs: MINUTE_MS },
  // Creating or editing trees: far above normal use, a brake on scripted writes from one account.
  treeWriteByUser: { limit: 30, windowMs: 15 * MINUTE_MS },
  // Each photo is decoded and re-encoded on the server: a tighter budget than other writes.
  photoUploadByUser: { limit: 10, windowMs: HOUR_MS },
  // Polled client-side every ~15s (module 2.7): generous for that, a brake on a script hammering it.
  notificationPollByUser: { limit: 20, windowMs: MINUTE_MS },
  // Sending a contact request (module 3.1): a brake on scripted outreach to discoverable members.
  contactRequestByUser: { limit: 10, windowMs: HOUR_MS },
} as const satisfies Record<string, RateLimitPolicy>

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES
