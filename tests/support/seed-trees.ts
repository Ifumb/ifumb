import { randomUUID } from 'node:crypto'
import type { Client } from 'pg'
import { withTestClient } from '@tests/support/test-database'

export type SeedTreeInput = {
  readonly ownerEmail: string
  readonly name: string
  readonly visibility: 'PRIVATE' | 'SHARED' | 'PUBLIC'
  readonly memberFirstNames?: readonly string[]
}

/** Inserts a tree owned by an existing test account, straight into the test database. */
export async function seedTree(input: SeedTreeInput): Promise<string> {
  return withTestClient(async (client) => {
    const ownerId = await findUserId(client, input.ownerEmail)
    const treeId = randomUUID()
    await client.query(
      `INSERT INTO "Tree" (id, name, visibility, "ownerId", "updatedAt")
       VALUES ($1, $2, $3::"Visibility", $4, now())`,
      [treeId, input.name, input.visibility, ownerId],
    )
    for (const firstName of input.memberFirstNames ?? []) {
      await client.query(
        'INSERT INTO "Member" (id, "firstName", "treeId", "updatedAt") VALUES ($1, $2, $3, now())',
        [randomUUID(), firstName, treeId],
      )
    }
    return treeId
  })
}

async function findUserId(client: Client, email: string): Promise<string> {
  const { rows } = await client.query<{ id: string }>('SELECT id FROM "User" WHERE email = $1', [
    email,
  ])
  const id = rows[0]?.id
  if (!id) throw new Error(`No test account with email ${email}`)
  return id
}
