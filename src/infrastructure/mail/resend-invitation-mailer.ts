import 'server-only'
import { randomUUID } from 'node:crypto'
import { Resend } from 'resend'
import type { InvitationMailer, InvitationMessage } from '@/core/use-cases/ports/invitation-mailer'
import { renderInvitationEmail } from '@/infrastructure/mail/invitation-email'
import { retryWithBackoff, type RetryOptions } from '@/infrastructure/resilience/retry-with-backoff'
import { TimeoutError, withTimeout } from '@/infrastructure/resilience/with-timeout'

export type InvitationMailerConfig = {
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

export class ResendInvitationMailer implements InvitationMailer {
  constructor(private readonly config: InvitationMailerConfig) {}

  async sendInvitation(message: InvitationMessage): Promise<void> {
    const idempotencyKey = randomUUID()
    const subject = `${message.inviterName} vous invite à collaborer sur « ${message.treeName} » — IFUMB`
    const html = renderInvitationEmail({
      inviterName: message.inviterName,
      treeName: message.treeName,
      acceptUrl: this.acceptUrl(message.token),
    })
    try {
      await retryWithBackoff(
        () => this.deliver(message.to.value, subject, html, idempotencyKey),
        isTransient,
        RETRY,
      )
    } catch (error) {
      // reason: logged rather than thrown, as the other mailers already do — the invitation is
      // recorded whether or not its email could be delivered.
      console.error(`Invitation email could not be sent: ${describe(error)}`)
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

  private acceptUrl(token: string): string {
    const url = new URL('/invitations/accept', this.config.appUrl)
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
