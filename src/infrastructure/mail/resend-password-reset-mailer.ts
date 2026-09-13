import 'server-only'
import { randomUUID } from 'node:crypto'
import { Resend } from 'resend'
import type {
  PasswordResetMailer,
  PasswordResetMessage,
} from '@/core/use-cases/ports/password-reset-mailer'
import { renderPasswordResetEmail } from '@/infrastructure/mail/password-reset-email'
import { retryWithBackoff, type RetryOptions } from '@/infrastructure/resilience/retry-with-backoff'
import { TimeoutError, withTimeout } from '@/infrastructure/resilience/with-timeout'

export type ResendMailerConfig = {
  readonly apiKey: string
  readonly from: string
  readonly appUrl: string
}

const RESET_PAGE_PATH = '/reset-password'
const SUBJECT = 'Réinitialisation de votre mot de passe IFUMB'
const ATTEMPT_TIMEOUT_MS = 5_000
const RETRY: RetryOptions = { maxAttempts: 3, baseDelayMs: 300, maxDelayMs: 2_000 }
const TOO_MANY_REQUESTS = 429
const FIRST_SERVER_ERROR = 500

/** A refused delivery, carrying what is needed to decide whether retrying can help. */
class DeliveryError extends Error {
  constructor(
    message: string,
    readonly statusCode: number | null,
    readonly code: string,
  ) {
    super(message)
    this.name = 'DeliveryError'
  }
}

export class ResendPasswordResetMailer implements PasswordResetMailer {
  constructor(private readonly config: ResendMailerConfig) {}

  async sendResetLink({ to, token }: PasswordResetMessage): Promise<void> {
    // reason: the same key on every attempt, so a send that succeeded but timed out is not
    // delivered twice when retried.
    const idempotencyKey = randomUUID()
    const html = renderPasswordResetEmail(this.resetUrl(token))
    try {
      await retryWithBackoff(() => this.deliver(to.value, html, idempotencyKey), isTransient, RETRY)
    } catch (error) {
      // reason: logged rather than thrown, as in the legacy API. A delivery failure surfacing to
      // the caller would tell registered addresses apart from unknown ones (account enumeration).
      // The recipient address is deliberately left out of the log.
      console.error(`Password reset email could not be sent: ${describe(error)}`)
    }
  }

  private async deliver(to: string, html: string, idempotencyKey: string): Promise<void> {
    const sending = new Resend(this.config.apiKey).emails.send(
      { from: this.config.from, to, subject: SUBJECT, html },
      { idempotencyKey },
    )
    const { error } = await withTimeout(sending, ATTEMPT_TIMEOUT_MS)
    if (error) throw new DeliveryError(error.message, error.statusCode, error.name)
  }

  private resetUrl(token: string): string {
    const url = new URL(RESET_PAGE_PATH, this.config.appUrl)
    url.searchParams.set('token', token)
    return url.toString()
  }
}

/** Network failures, timeouts, throttling and server errors may clear up; quotas and bad input will not. */
function isTransient(error: unknown): boolean {
  if (error instanceof TimeoutError) return true
  if (!(error instanceof DeliveryError)) return false
  if (error.statusCode === null) return true
  const throttled = error.statusCode === TOO_MANY_REQUESTS && error.code === 'rate_limit_exceeded'
  return throttled || error.statusCode >= FIRST_SERVER_ERROR
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error'
}
