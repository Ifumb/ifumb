import 'server-only'
import type { RateLimiter } from '@/core/use-cases/ports/rate-limiter'
import type { RateLimitPolicyName } from '@/infrastructure/rate-limiting/rate-limit-policies'

export type AttemptKey = { readonly policy: RateLimitPolicyName; readonly subject: string }

/**
 * Consumes one attempt from every listed budget and reports whether all of them still allow it.
 * Every budget is charged even when an earlier one refuses, so hammering one key cannot keep
 * another key's counter untouched.
 */
export async function isAttemptAllowed(
  limiters: Readonly<Record<RateLimitPolicyName, RateLimiter>>,
  keys: readonly AttemptKey[],
): Promise<boolean> {
  const decisions = await Promise.all(
    keys.map(({ policy, subject }) => limiters[policy].consume(`${policy}:${subject}`)),
  )
  return decisions.every((decision) => decision.allowed)
}
