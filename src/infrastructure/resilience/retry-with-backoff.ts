import 'server-only'

export type RetryOptions = {
  readonly maxAttempts: number
  readonly baseDelayMs: number
  readonly maxDelayMs: number
}

const JITTER_RATIO = 0.5

/**
 * Runs `operation`, retrying failures that `isRetryable` accepts with exponential backoff and
 * jitter. A non-retryable failure, or the last attempt's failure, is rethrown as is.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  isRetryable: (error: unknown) => boolean,
  options: RetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (!isRetryable(error) || attempt >= options.maxAttempts) throw error
      await sleep(backoffDelay(attempt, options))
    }
  }
}

function backoffDelay(attempt: number, options: RetryOptions): number {
  const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1))
  return exponential + Math.random() * exponential * JITTER_RATIO
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
