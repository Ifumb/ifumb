import 'server-only'
import type { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import type { ConnectionRequestWriter } from '@/core/use-cases/ports/connection-request-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaConnectionRequestWriter implements ConnectionRequestWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async create(request: CrossTreeConnectionRequest): Promise<void> {
    await this.db.crossTreeConnectionRequest.create({
      data: {
        id: request.id,
        requesterTreeId: request.requesterTreeId,
        requesterMemberId: request.requesterMemberId,
        targetTreeId: request.targetTreeId,
        targetMemberId: request.targetMemberId,
        initiatedByUserId: request.initiatedByUserId,
        status: request.status,
        expiresAt: request.expiresAt,
      },
    })
  }

  async resolve(request: CrossTreeConnectionRequest): Promise<void> {
    await this.db.crossTreeConnectionRequest.update({
      where: { id: request.id },
      data: {
        status: request.status,
        resolvedAt: request.resolvedAt,
        resolvedByUserId: request.resolvedByUserId,
      },
    })
  }

  async expireStale(targetTreeId: string, now: Date): Promise<void> {
    await this.db.crossTreeConnectionRequest.updateMany({
      where: { targetTreeId, status: 'PENDING', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    })
  }
}
