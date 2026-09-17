import 'server-only'
import type { Email } from '@/core/shared/value-objects/email'

export type InvitationMessage = {
  readonly to: Email
  readonly inviterName: string
  readonly treeName: string
  readonly token: string
}

/** Delivers an invitation link to the person invited. */
export interface InvitationMailer {
  sendInvitation(message: InvitationMessage): Promise<void>
}
