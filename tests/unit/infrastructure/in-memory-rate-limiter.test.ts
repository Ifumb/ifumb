import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryRateLimiter } from '@/infrastructure/rate-limiting/in-memory-rate-limiter'
import { ManualClock } from '@tests/support/fakes'

const LIMIT = 2
const WINDOW_MS = 60_000

describe('InMemoryRateLimiter', () => {
  let clock: ManualClock
  let limiter: InMemoryRateLimiter

  beforeEach(() => {
    clock = new ManualClock(new Date('2026-03-01T10:00:00Z'))
    limiter = new InMemoryRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS, clock })
  })

  it('allows attempts up to the limit and counts down what remains', async () => {
    const first = await limiter.consume('login:alice')
    const second = await limiter.consume('login:alice')

    expect([first, second]).toEqual([
      { allowed: true, remaining: 1, retryAfterMs: 0 },
      { allowed: true, remaining: 0, retryAfterMs: 0 },
    ])
  })

  it('refuses the attempt beyond the limit and says how long to wait', async () => {
    await limiter.consume('login:alice')
    await limiter.consume('login:alice')
    clock.advanceBy(15_000)

    const refused = await limiter.consume('login:alice')

    expect(refused).toEqual({ allowed: false, remaining: 0, retryAfterMs: 45_000 })
  })

  it('allows attempts again once the window has elapsed', async () => {
    await limiter.consume('login:alice')
    await limiter.consume('login:alice')
    clock.advanceBy(WINDOW_MS)

    const afterWindow = await limiter.consume('login:alice')

    expect(afterWindow).toEqual({ allowed: true, remaining: 1, retryAfterMs: 0 })
  })

  it('counts each key on its own', async () => {
    await limiter.consume('login:alice')
    await limiter.consume('login:alice')

    const otherKey = await limiter.consume('login:bob')

    expect(otherKey.allowed).toBe(true)
  })
})
