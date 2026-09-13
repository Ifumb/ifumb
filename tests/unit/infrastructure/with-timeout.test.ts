import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { withTimeout } from '@/infrastructure/resilience/with-timeout'

const TIMEOUT_MS = 5_000

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the result that arrives before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('sent'), TIMEOUT_MS)).resolves.toBe('sent')
  })

  it('rejects once the deadline passes, naming the delay', async () => {
    const neverSettles = new Promise<string>(() => {})

    const outcome = expect(withTimeout(neverSettles, TIMEOUT_MS)).rejects.toThrow('5000ms')
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS)

    await outcome
  })

  it('leaves no pending timer behind once the result has arrived', async () => {
    await withTimeout(Promise.resolve('sent'), TIMEOUT_MS)

    expect(vi.getTimerCount()).toBe(0)
  })
})
