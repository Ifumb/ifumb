import 'server-only'
import type { Invitation } from '@/core/entities/invitation'
import type { InvitationWriter } from '@/core/use-cases/ports/invitation-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaInvitationWriter implements InvitationWriter {
  constructor(private readonly db: PrismaExecutor) {}

  /** `(treeId, email)` is unique in the database: sending resets the one row it may ever have. */
  async send(invitation: Invitation): Promise<void> {
    await this.db.invitation.upsert({
      where: { treeId_email: { treeId: invitation.treeId, email: invitation.email } },
      create: {
        id: invitation.id,
        treeId: invitation.treeId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
      update: {
        role: invitation.role,
        status: invitation.status,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        userId: null,
      },
    })
  }

  async resolve(invitation: Invitation): Promise<void> {
    await this.db.invitation.update({
      where: { id: invitation.id },
      data: { status: invitation.status, token: invitation.token, userId: invitation.userId },
    })
  }

  async changeRole(invitation: Invitation): Promise<void> {
    await this.db.invitation.update({
      where: { id: invitation.id },
      data: { role: invitation.role },
    })
  }

  async revoke(invitationId: string): Promise<void> {
    await this.db.invitation.delete({ where: { id: invitationId } })
  }
}
