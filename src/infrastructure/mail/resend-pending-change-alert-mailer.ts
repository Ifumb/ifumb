import 'server-only'
import { randomUUID } from 'node:crypto'
import { Resend } from 'resend'
import type {
  PendingChangeAlertMailer,
  PendingChangeAlertMessage,
} from '@/core/use-cases/ports/pending-change-alert-mailer'
import { renderPendingChangeAlertEmail } from '@/infrastructure/mail/pending-change-alert-email'
import { retryWithBackoff, type RetryOptions } from '@/infrastructure/resilience/retry-with-backoff'
import { TimeoutError, withTimeout } from '@/infrastructure/resilience/with-timeout'

export type PendingChangeAlertMailerConfig = {
  readonly apiKey: string
  readonly from: string
  readonly appUrl: string
}

const ATTEMPT_TIMEOUT_MS = 5_000
const RETRY: RetryOptions = { maxAttempts: 3, baseDelayMs: 300, maxDelayMs: 2_000 }
const TOO_MANY_REQUESTS = 429
const FIRST_SERVER_ERROR = 500

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

export class ResendPendingChangeAlertMailer implements PendingChangeAlertMailer {
  constructor(private readonly config: PendingChangeAlertMailerConfig) {}

  async sendAlert(message: PendingChangeAlertMessage): Promise<void> {
    // reason: the same key on every attempt, so a send that succeeded but timed out is not
    // delivered twice when retried.
    const idempotencyKey = randomUUID()
    const subject = `[IFUMB] ${message.pendingCount} modification(s) en attente sur "${message.treeName}"`
    const html = renderPendingChangeAlertEmail({
      ownerName: message.ownerName,
      editorName: message.editorName,
      treeName: message.treeName,
      pendingCount: message.pendingCount,
      reviewUrl: this.reviewUrl(message.treeId),
    })
    try {
      await retryWithBackoff(
        () => this.deliver(message.to.value, subject, html, idempotencyKey),
        isTransient,
        RETRY,
      )
    } catch (error) {
      // reason: logged rather than thrown, as the password reset mailer already does — a proposal
      // is recorded whether or not the owner's alert email could be delivered.
      console.error(`Pending change alert email could not be sent: ${describe(error)}`)
    }
  }

  private async deliver(
    to: string,
    subject: string,
    html: string,
    idempotencyKey: string,
  ): Promise<void> {
    const sending = new Resend(this.config.apiKey).emails.send(
      { from: this.config.from, to, subject, html },
      { idempotencyKey },
    )
    const { error } = await withTimeout(sending, ATTEMPT_TIMEOUT_MS)
    if (error) throw new DeliveryError(error.message, error.statusCode, error.name)
  }

  private reviewUrl(treeId: string): string {
    return new URL(`/tree/${treeId}`, this.config.appUrl).toString()
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
