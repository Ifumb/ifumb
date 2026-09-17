import 'server-only'
import { Ratelimit, type Duration } from '@upstash/ratelimit'
import type { Redis } from '@upstash/redis'
import type { RateLimitDecision, RateLimiter } from '@/core/use-cases/ports/rate-limiter'
import type { RateLimitPolicy } from '@/infrastructure/rate-limiting/in-memory-rate-limiter'

/**
 * Fixed-window counter held in Upstash Redis over its HTTP API, shared by every serverless
 * instance — `InMemoryRateLimiter`'s per-process counter cannot be trusted once more than one
 * instance may handle a request (Phase 4 cutover to Vercel; see ADR 0009).
 */
export class UpstashRateLimiter implements RateLimiter {
  private readonly limiter: Ratelimit

  constructor(policy: RateLimitPolicy, redis: Redis) {
    this.limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(policy.limit, `${policy.windowMs} ms` as Duration),
      prefix: 'ifumb',
    })
  }

  async consume(key: string): Promise<RateLimitDecision> {
    const { success, remaining, reset } = await this.limiter.limit(key)
    return { allowed: success, remaining, retryAfterMs: Math.max(0, reset - Date.now()) }
  }
}
