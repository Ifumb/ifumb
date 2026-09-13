import 'server-only'

export type RateLimitDecision = {
  readonly allowed: boolean
  readonly remaining: number
  /** How long to wait before the next attempt can succeed; 0 when allowed. */
  readonly retryAfterMs: number
}

/** Counts attempts per key (e.g. `login:ip:1.2.3.4`) and says whether one more is allowed. */
export interface RateLimiter {
  consume(key: string): Promise<RateLimitDecision>
}
