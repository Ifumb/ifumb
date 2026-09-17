import 'server-only'
import type { Invitation } from '@/core/entities/invitation'

/**
 * Write side of invitations.
 * reason: `(treeId, email)` is unique in the database (one row ever, of any status) — `send` is
 * always an upsert on that pair, never a blind insert, so re-inviting an email that once rejected
 * or that is still pending resets the same row instead of failing on that constraint.
 */
export interface InvitationWriter {
  send(invitation: Invitation): Promise<void>
  resolve(invitation: Invitation): Promise<void>
  changeRole(invitation: Invitation): Promise<void>
  revoke(invitationId: string): Promise<void>
}
