import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type RevokeInvitationInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly invitationId: string
}

export type RevokeInvitationError = TreeManagementError | { readonly kind: 'INVITATION_NOT_FOUND' }

type RevokeInvitationDeps = {
  readonly trees: TreeReader
  readonly invitations: InvitationReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * The owner withdraws an invitation, accepted or not. A revoked collaborator's still-pending
 * proposals are rejected in the same transaction — they can no longer be corrected by someone who
 * has just lost access to the tree (module 2.8, ported from the legacy `rejectAllByUser`).
 */
export class RevokeInvitationUseCase {
  constructor(private readonly deps: RevokeInvitationDeps) {}

  async execute(input: RevokeInvitationInput): Promise<Result<void, RevokeInvitationError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access

    const invitation = await this.deps.invitations.findById(input.invitationId)
    if (!invitation || invitation.treeId !== input.treeId) {
      return err({ kind: 'INVITATION_NOT_FOUND' })
    }
    const now = this.deps.clock.now()
    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.invitations.revoke(invitation.id)
      if (invitation.status === 'ACCEPTED' && invitation.userId) {
        await context.pendingChanges.rejectAllByAuthor(input.treeId, invitation.userId, now)
      }
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: input.treeId,
        authorId: input.viewerId,
        action: 'INVITATION_REVOKED',
        targetType: 'INVITATION',
        targetId: invitation.id,
        diff: { before: { email: invitation.email, role: invitation.role }, after: null },
        createdAt: now,
      })
    })
    return ok(undefined)
  }
}
