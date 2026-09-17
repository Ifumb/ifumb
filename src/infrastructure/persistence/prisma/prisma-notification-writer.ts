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
        pendingChangeId: entry.pendingChangeId ?? null,
        contactRequestId: entry.contactRequestId ?? null,
        createdAt: entry.createdAt,
      },
    })
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.db.notification.updateMany({ where: { id, userId }, data: { read: true } })
  }

  async markAllRead(userId: string): Promise<number> {
    const { count } = await this.db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    return count
  }
}
