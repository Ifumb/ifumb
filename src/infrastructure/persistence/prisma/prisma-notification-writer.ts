import 'server-only'
import type { NotificationRecord, NotificationWriter } from '@/core/use-cases/ports/notification-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaNotificationWriter implements NotificationWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async record(entry: NotificationRecord): Promise<void> {
    await this.db.notification.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        type: entry.type,
        pendingChangeId: entry.pendingChangeId,
        createdAt: entry.createdAt,
      },
    })
  }
}
