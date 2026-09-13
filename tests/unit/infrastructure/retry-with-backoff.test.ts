import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { retryWithBackoff } from '@/infrastructure/resilience/retry-with-backoff'

class TransientFailure extends Error {}
class PermanentFailure extends Error {}

const isTransient = (error: unknown) => error instanceof TransientFailure
const OPTIONS = { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1_000 }

/** An operation that fails with the given errors, in order, then succeeds. */
function failingThen(errors: Error[]) {
  const calls = { count: 0 }
  const operation = async () => {
    const error = errors[calls.count]
    calls.count += 1
    if (error) throw error
    return 'sent'
  }
  return { operation, calls }
}

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries a transient failure and returns the eventual result', async () => {
    const { operation } = failingThen([new TransientFailure(), new TransientFailure()])

    const result = retryWithBackoff(operation, isTransient, OPTIONS)
    await vi.runAllTimersAsync()

    await expect(result).resolves.toBe('sent')
  })

  it('stops at once on a permanent failure', async () => {
    const { operation, calls } = failingThen([new PermanentFailure('rejected')])

    const outcome = expect(retryWithBackoff(operation, isTransient, OPTIONS)).rejects.toThrow(
      'rejected',
    )
    await vi.runAllTimersAsync()

    await outcome
    expect(calls.count).toBe(1)
  })

  it('gives up after the maximum number of attempts, rethrowing the last error', async () => {
    const failures = [
      new TransientFailure('1'),
      new TransientFailure('2'),
      new TransientFailure('3'),
    ]
    const { operation, calls } = failingThen(failures)

    const outcome = expect(retryWithBackoff(operation, isTransient, OPTIONS)).rejects.toThrow('3')
    await vi.runAllTimersAsync()

    await outcome
    expect(calls.count).toBe(OPTIONS.maxAttempts)
  })
})
