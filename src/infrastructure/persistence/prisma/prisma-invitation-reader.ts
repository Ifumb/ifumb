import 'server-only'
import { Invitation } from '@/core/entities/invitation'
import type { CollaboratorView, InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const USER_INCLUDE = { user: { select: { firstName: true, lastName: true } } } as const

type CollaboratorRow = Prisma.InvitationGetPayload<{ include: typeof USER_INCLUDE }>

export class PrismaInvitationReader implements InvitationReader {
  constructor(private readonly db: PrismaExecutor) {}

  async findByToken(token: string): Promise<Invitation | null> {
    const row = await this.db.invitation.findUnique({ where: { token } })
    return row ? Invitation.create(row) : null
  }

  async findById(invitationId: string): Promise<Invitation | null> {
    const row = await this.db.invitation.findUnique({ where: { id: invitationId } })
    return row ? Invitation.create(row) : null
  }

  async findByTreeAndEmail(treeId: string, email: string): Promise<Invitation | null> {
    const row = await this.db.invitation.findUnique({ where: { treeId_email: { treeId, email } } })
    return row ? Invitation.create(row) : null
  }

  async listForTree(treeId: string): Promise<readonly CollaboratorView[]> {
    const rows = await this.db.invitation.findMany({
      where: { treeId },
      orderBy: { createdAt: 'desc' },
      include: USER_INCLUDE,
    })
    return rows.map(toCollaboratorView)
  }
}

function toCollaboratorView(row: CollaboratorRow): CollaboratorView {
  return { invitation: Invitation.create(row), user: toPersonName(row.user) }
}

function toPersonName(user: { firstName: string; lastName: string } | null): PersonName | null {
  return user ? { firstName: user.firstName, lastName: user.lastName } : null
}
