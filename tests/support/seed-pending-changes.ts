import { randomUUID } from 'node:crypto'
import { withTestClient } from '@tests/support/test-database'

export type SeedPendingChangeInput = {
  readonly targetType: 'MEMBER' | 'UNION'
  readonly targetId: string
  readonly action: 'CREATE' | 'UPDATE' | 'DELETE'
}

/** Inserts a change proposed by the tree owner and still waiting for review. */
export async function seedPendingChange(
  treeId: string,
  input: SeedPendingChangeInput,
): Promise<void> {
  await withTestClient((client) =>
    client.query(
      `INSERT INTO "PendingChange" (id, "treeId", "authorId", "targetType", "targetId", action)
       SELECT $1, t.id, t."ownerId", $2::"PendingTargetType", $3, $4::"PendingAction"
       FROM "Tree" t WHERE t.id = $5`,
      [randomUUID(), input.targetType, input.targetId, input.action, treeId],
    ),
  )
}
