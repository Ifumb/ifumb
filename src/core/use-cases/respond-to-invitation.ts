import 'server-only'
import type {
  InvitationAlreadyResolved,
  InvitationDecision,
  InvitationExpired,
} from '@/core/entities/invitation'
import { err, ok, type Result } from '@/core/shared/result'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'

export type RespondToInvitationInput = {
  readonly token: string
  readonly viewerId: string
  readonly decision: InvitationDecision
}

export type RespondToInvitationError =
  | { readonly kind: 'INVITATION_NOT_FOUND' }
  | { readonly kind: 'INVITATION_EMAIL_MISMATCH' }
  | InvitationAlreadyResolved
  | InvitationExpired

type RespondToInvitationDeps = {
  readonly invitations: InvitationReader
  readonly users: UserRepository
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The invitee accepts or rejects; only the account whose email matches may decide. */
export class RespondToInvitationUseCase {
  constructor(private readonly deps: RespondToInvitationDeps) {}

  async execute(
    input: RespondToInvitationInput,
  ): Promise<Result<{ treeId: string }, RespondToInvitationError>> {
    const invitation = await this.deps.invitations.findByToken(input.token)
    if (!invitation) return err({ kind: 'INVITATION_NOT_FOUND' })

    const viewer = await this.deps.users.findById(UserId.fromString(input.viewerId))
    if (!viewer || viewer.email.value !== invitation.email) {
      return err({ kind: 'INVITATION_EMAIL_MISMATCH' })
    }

    const now = this.deps.clock.now()
    const resolved = invitation.resolve(input.decision, { userId: input.viewerId, now })
    if (!resolved.ok) return resolved

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.invitations.resolve(resolved.value)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: invitation.treeId,
        authorId: input.viewerId,
        action: input.decision === 'ACCEPTED' ? 'INVITATION_ACCEPTED' : 'INVITATION_REJECTED',
        targetType: 'INVITATION',
        targetId: invitation.id,
        diff: { before: { status: 'PENDING' }, after: { status: input.decision } },
        createdAt: now,
      })
    })
    return ok({ treeId: invitation.treeId })
  }
}
