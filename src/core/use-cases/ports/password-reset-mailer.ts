import 'server-only'
import type { Email } from '@/core/shared/value-objects/email'

export type PasswordResetMessage = {
  readonly to: Email
  readonly token: string
}

/** Delivers the password reset link to the account owner. */
export interface PasswordResetMailer {
  sendResetLink(message: PasswordResetMessage): Promise<void>
}
