import 'server-only'
import type { ContactRequest } from '@/core/entities/contact-request'
import type { ContactRequestWriter } from '@/core/use-cases/ports/contact-request-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaContactRequestWriter implements ContactRequestWriter {
  constructor(private readonly db: PrismaExecutor) {}

  /** `(requesterId, memberId)` is unique in the database: sending resets the one row it may ever have. */
  async send(contactRequest: ContactRequest): Promise<void> {
    await this.db.contactRequest.upsert({
      where: {
        requesterId_memberId: {
          requesterId: contactRequest.requesterId,
          memberId: contactRequest.memberId,
        },
      },
      create: {
        id: contactRequest.id,
        treeId: contactRequest.treeId,
        memberId: contactRequest.memberId,
        requesterId: contactRequest.requesterId,
        message: contactRequest.message,
        status: contactRequest.status,
      },
      update: { message: contactRequest.message, status: contactRequest.status },
    })
  }

  async resolve(contactRequest: ContactRequest): Promise<void> {
    await this.db.contactRequest.update({
      where: { id: contactRequest.id },
      data: { status: contactRequest.status },
    })
  }
}
