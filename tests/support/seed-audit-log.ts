import { randomUUID } from 'node:crypto'
import { withTestClient } from '@tests/support/test-database'

export type SeedAuditEntryInput = {
  readonly action: string
  readonly targetType?: string
  readonly diff: unknown
  readonly createdAt: Date
}

/** Inserts audit entries written by the tree owner, as the legacy app stored them. */
export async function seedAuditEntries(
  treeId: string,
  entries: readonly SeedAuditEntryInput[],
): Promise<void> {
  await withTestClient(async (client) => {
    for (const entry of entries) {
      await client.query(
        `INSERT INTO "AuditLog" (id, "treeId", "authorId", action, "targetType", "targetId", diff, "createdAt")
         SELECT $1, t.id, t."ownerId", $2::"AuditAction", $3, $4, $5::jsonb, $6 FROM "Tree" t WHERE t.id = $7`,
        [
          randomUUID(),
          entry.action,
          entry.targetType ?? 'MEMBER',
          randomUUID(),
          JSON.stringify(entry.diff),
          entry.createdAt,
          treeId,
        ],
      )
    }
  })
}
