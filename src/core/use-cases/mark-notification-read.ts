import 'server-only'
import type { NotificationWriter } from '@/core/use-cases/ports/notification-writer'

export type MarkNotificationReadInput = { readonly notificationId: string; readonly viewerId: string }

type MarkNotificationReadDeps = { readonly notifications: NotificationWriter }

/**
 * Marks one notification read. Scoped to its own author at the writer: reading someone else's by
 * guessing its id neither succeeds nor errors — the same silence either way tells an attacker
 * nothing about whether that id even exists.
 */
export class MarkNotificationReadUseCase {
  constructor(private readonly deps: MarkNotificationReadDeps) {}

  async execute(input: MarkNotificationReadInput): Promise<void> {
    await this.deps.notifications.markRead(input.notificationId, input.viewerId)
  }
}
