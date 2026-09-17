import 'server-only'
import type { InvitationStatus } from '@/core/entities/invitation'
import type { InvitationRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'

export type InvitationPreview = {
  readonly invitationId: string
  readonly treeId: string
  readonly treeName: string
  readonly inviterName: string
  readonly email: string
  readonly role: InvitationRole
  readonly status: InvitationStatus
}

export type GetInvitationByTokenError =
  | { readonly kind: 'INVITATION_NOT_FOUND' }
  | { readonly kind: 'INVITATION_EXPIRED' }

type GetInvitationByTokenDeps = {
  readonly invitations: InvitationReader
  readonly trees: TreeReader
  readonly clock: Clock
}

/**
 * A public lookup, reachable without a session: the accept page needs it before the visitor has
 * necessarily signed in. Once resolved, an invitation's token is cleared (see `Invitation.resolve`)
 * — visiting the same link again finds nothing rather than a stale "already processed" state.
 */
export class GetInvitationByTokenUseCase {
  constructor(private readonly deps: GetInvitationByTokenDeps) {}

  async execute(token: string): Promise<Result<InvitationPreview, GetInvitationByTokenError>> {
    const invitation = await this.deps.invitations.findByToken(token)
    if (!invitation) return err({ kind: 'INVITATION_NOT_FOUND' })
    if (invitation.isExpired(this.deps.clock.now())) return err({ kind: 'INVITATION_EXPIRED' })

    const listing = await this.deps.trees.findById(TreeId.fromString(invitation.treeId))
    if (!listing) return err({ kind: 'INVITATION_NOT_FOUND' })
    return ok({
      invitationId: invitation.id,
      treeId: invitation.treeId,
      treeName: listing.tree.name,
      inviterName: `${listing.ownerName.firstName} ${listing.ownerName.lastName}`.trim(),
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
    })
  }
}
