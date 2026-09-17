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

/**
 * The token of a still-pending invitation, read directly from the database. E2E runs never
 * deliver a real invitation email (no RESEND_API_KEY), so this stands in for "the link the invitee
 * would have clicked" — the UI never exposes a token to the owner, by design.
 */
export async function findInvitationToken(treeId: string, email: string): Promise<string> {
  const token = await withTestClient(async (client) => {
    const { rows } = await client.query<{ token: string | null }>(
      `SELECT token FROM "Invitation" WHERE "treeId" = $1 AND email = $2`,
      [treeId, email],
    )
    return rows[0]?.token ?? null
  })
  if (!token) throw new Error(`No pending invitation found for ${email} on tree ${treeId}`)
  return token
}
