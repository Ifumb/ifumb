import 'server-only'
import type { NotificationReader, NotificationView } from '@/core/use-cases/ports/notification-reader'
import type { NotificationType } from '@/core/use-cases/ports/notification-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

type PersonName = { readonly firstName: string; readonly lastName: string | null }

type NotificationRow = {
  readonly id: string
  readonly type: NotificationType
  readonly read: boolean
  readonly createdAt: Date
  readonly pendingChange: {
    readonly tree: { readonly id: string; readonly name: string }
    readonly author: PersonName
    readonly resolvedBy: PersonName | null
  } | null
}

const PENDING_CHANGE_INCLUDE = {
  include: {
    tree: { select: { id: true, name: true } },
    author: { select: { firstName: true, lastName: true } },
    resolvedBy: { select: { firstName: true, lastName: true } },
  },
} as const

export class PrismaNotificationReader implements NotificationReader {
  constructor(private readonly db: PrismaExecutor) {}

  async listForUser(userId: string, limit: number): Promise<readonly NotificationView[]> {
    const rows = await this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        read: true,
        createdAt: true,
        pendingChange: PENDING_CHANGE_INCLUDE,
      },
    })
    return rows.map(toView)
  }

  async unreadCountFor(userId: string): Promise<number> {
    return this.db.notification.count({ where: { userId, read: false } })
  }
}

/** For an owner, the proposal's author; for its author, whoever resolved it. */
function toView(row: NotificationRow): NotificationView {
  const { pendingChange } = row
  const person = row.type === 'PENDING_CHANGE_CREATED' ? pendingChange?.author : pendingChange?.resolvedBy
  return {
    id: row.id,
    type: row.type,
    read: row.read,
    createdAt: row.createdAt,
    treeId: pendingChange?.tree.id ?? null,
    treeName: pendingChange?.tree.name ?? null,
    personName: person ? [person.firstName, person.lastName].filter(Boolean).join(' ') : null,
  }
}
