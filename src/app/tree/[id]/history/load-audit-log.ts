import 'server-only'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import type { AuditLogRequest } from '@/presentation/schemas/audit-log-schema'

/** Reads one page of a tree's history for the current visitor. */
export async function loadAuditLog(treeId: string, request: AuditLogRequest) {
  const viewer = await currentUserOrNull()
  const result = await container.getAuditLog().execute({ treeId, viewerId: viewer?.id, ...request })
  return { signedIn: viewer !== null, result }
}
