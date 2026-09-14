import { randomUUID } from 'node:crypto'
import { withTestClient } from '@tests/support/test-database'

/** Records that an existing test account accepted an invitation to a tree with the given role. */
export async function seedAcceptedInvitation(
  treeId: string,
  email: string,
  role: 'EDITOR' | 'VIEWER',
): Promise<void> {
  await withTestClient((client) =>
    client.query(
      `INSERT INTO "Invitation" (id, role, status, email, "treeId", "userId", "updatedAt")
       SELECT $1, $2::"InvitationRole", 'ACCEPTED'::"InvitationStatus", u.email, $3, u.id, now()
       FROM "User" u WHERE u.email = $4`,
      [randomUUID(), role, treeId, email],
    ),
  )
}
