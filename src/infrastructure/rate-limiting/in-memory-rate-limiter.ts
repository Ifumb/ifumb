import 'server-only'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { RateLimitDecision, RateLimiter } from '@/core/use-cases/ports/rate-limiter'

export type RateLimitPolicy = {
  readonly limit: number
  readonly windowMs: number
}

type InMemoryRateLimiterConfig = RateLimitPolicy & { readonly clock: Clock }

type Window = { readonly count: number; readonly startedAt: number }

/**
 * Fixed-window counter held in this process.
 * Single-instance only: several instances would each keep their own count, so a multi-instance
 * deployment needs a shared-store implementation of the same port.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, Window>()

  constructor(private readonly config: InMemoryRateLimiterConfig) {}

  async consume(key: string): Promise<RateLimitDecision> {
    const now = this.config.clock.now().getTime()
    const current = this.windows.get(key)

    if (!current || now - current.startedAt >= this.config.windowMs) {
      this.windows.set(key, { count: 1, startedAt: now })
      return allowed(this.config.limit - 1)
    }
    if (current.count < this.config.limit) {
      this.windows.set(key, { ...current, count: current.count + 1 })
      return allowed(this.config.limit - current.count - 1)
    }
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: this.config.windowMs - (now - current.startedAt),
    }
  }
}

function allowed(remaining: number): RateLimitDecision {
  return { allowed: true, remaining, retryAfterMs: 0 }
}
