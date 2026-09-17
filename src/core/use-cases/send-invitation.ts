import 'server-only'
import { Invitation } from '@/core/entities/invitation'
import type { InvitationRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { Email, type InvalidEmail } from '@/core/shared/value-objects/email'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { InvitationMailer } from '@/core/use-cases/ports/invitation-mailer'
import type { InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { TokenGenerator } from '@/core/use-cases/ports/token-generator'
import type { TreeListing, TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type SendInvitationInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly email: string
  readonly role: InvitationRole
}

export type SendInvitationError =
  | TreeManagementError
  | InvalidEmail
  | { readonly kind: 'ALREADY_COLLABORATOR' }

type SendInvitationDeps = {
  readonly trees: TreeReader
  readonly invitations: InvitationReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly tokens: TokenGenerator
  readonly clock: Clock
  readonly mailer: InvitationMailer
}

export class SendInvitationUseCase {
  constructor(private readonly deps: SendInvitationDeps) {}

  async execute(input: SendInvitationInput): Promise<Result<void, SendInvitationError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access
    const email = Email.parse(input.email)
    if (!email.ok) return email

    const existing = await this.deps.invitations.findByTreeAndEmail(input.treeId, email.value.value)
    if (existing?.status === 'ACCEPTED') return err({ kind: 'ALREADY_COLLABORATOR' })

    const now = this.deps.clock.now()
    const token = this.deps.tokens.generate()
    const invitation = Invitation.send({
      id: existing?.id ?? this.deps.ids.next(),
      treeId: input.treeId,
      email: email.value.value,
      role: input.role,
      token,
      expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
      now,
    })
    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.invitations.send(invitation)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: input.treeId,
        authorId: input.viewerId,
        action: 'INVITATION_SENT',
        targetType: 'INVITATION',
        targetId: invitation.id,
        diff: { before: null, after: { email: invitation.email, role: invitation.role } },
        createdAt: now,
      })
    })

    await this.sendMailBestEffort(access.value.listing, email.value, token)
    return ok(undefined)
  }

  /**
   * reason: the invitation is already recorded; a failure preparing or sending its email — even a
   * missing RESEND_API_KEY, since `mailer` is a lazy getter constructed right here — must not
   * surface as a failure of the invitation itself (same best-effort shape as `proposal-recording`).
   */
  private async sendMailBestEffort(listing: TreeListing, to: Email, token: string): Promise<void> {
    try {
      await this.deps.mailer.sendInvitation({
        to,
        inviterName: `${listing.ownerName.firstName} ${listing.ownerName.lastName}`.trim(),
        treeName: listing.tree.name,
        token,
      })
    } catch (error) {
      console.error(`Invitation email could not be prepared: ${describe(error)}`)
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error'
}
