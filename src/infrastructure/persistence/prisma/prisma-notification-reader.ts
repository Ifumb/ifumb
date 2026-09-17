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
  readonly contactRequest: {
    readonly tree: { readonly id: string; readonly name: string; readonly owner: PersonName }
    readonly requester: PersonName
  } | null
}

const PENDING_CHANGE_INCLUDE = {
  include: {
    tree: { select: { id: true, name: true } },
    author: { select: { firstName: true, lastName: true } },
    resolvedBy: { select: { firstName: true, lastName: true } },
  },
} as const

const CONTACT_REQUEST_INCLUDE = {
  include: {
    tree: {
      select: { id: true, name: true, owner: { select: { firstName: true, lastName: true } } },
    },
    requester: { select: { firstName: true, lastName: true } },
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
        contactRequest: CONTACT_REQUEST_INCLUDE,
      },
    })
    return rows.map(toView)
  }

  async unreadCountFor(userId: string): Promise<number> {
    return this.db.notification.count({ where: { userId, read: false } })
  }
}

/**
 * For an owner, who proposed or who is contacting them; for the other side, who resolved or who
 * they contacted.
 */
function toView(row: NotificationRow): NotificationView {
  const { pendingChange, contactRequest } = row
  if (pendingChange) {
    const person = row.type === 'PENDING_CHANGE_CREATED' ? pendingChange.author : pendingChange.resolvedBy
    return notificationView(row, pendingChange.tree, person)
  }
  if (contactRequest) {
    const person = row.type === 'CONTACT_REQUEST_RECEIVED' ? contactRequest.requester : contactRequest.tree.owner
    return notificationView(row, contactRequest.tree, person)
  }
  return notificationView(row, null, null)
}

function notificationView(
  row: NotificationRow,
  tree: { readonly id: string; readonly name: string } | null,
  person: PersonName | null,
): NotificationView {
  return {
    id: row.id,
    type: row.type,
    read: row.read,
    createdAt: row.createdAt,
    treeId: tree?.id ?? null,
    treeName: tree?.name ?? null,
    personName: person ? [person.firstName, person.lastName].filter(Boolean).join(' ') : null,
  }
}
