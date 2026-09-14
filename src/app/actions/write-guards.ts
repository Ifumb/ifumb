import 'server-only'
import { BusinessWritesDisabledError } from '@/infrastructure/config/business-writes'
import { container } from '@/infrastructure/di/container'

/** Charges one write to the user's budget, shared by every change made inside trees. */
export function withinWriteBudget(userId: string): Promise<boolean> {
  return container.allowsAttempt([{ policy: 'treeWriteByUser', subject: userId }])
}

/** Runs a write; null when this environment has business writes turned off (ADR 0005). */
export async function whenWritesEnabled<T>(write: () => Promise<T>): Promise<T | null> {
  try {
    return await write()
  } catch (error) {
    if (error instanceof BusinessWritesDisabledError) return null
    throw error
  }
}
