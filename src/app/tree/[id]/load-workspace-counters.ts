import 'server-only'
import { container } from '@/infrastructure/di/container'

export async function loadWorkspaceCounters(treeId: string, ownerId?: string) {
  if (!ownerId) return { pendingCount: 0, connectionCount: 0 }
  const input = { treeId, viewerId: ownerId }
  const [pending, requests] = await Promise.all([
    container.getPendingChanges().execute(input),
    container.getConnectionRequests().execute(input),
  ])
  return {
    pendingCount: pending.ok ? pending.value.changes.length : 0,
    connectionCount: requests.ok ? requests.value.length : 0,
  }
}
