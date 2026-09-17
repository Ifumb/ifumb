import { randomUUID } from 'node:crypto'
import { withTestClient } from '@tests/support/test-database'

/** Inserts an already-established `CrossTreeLink` straight into the test database (module 3.3):
 * the module 3.2 accept/approve flow that normally creates one is tested on its own already. */
export async function seedCrossTreeLink(
  tree1Id: string,
  member1Id: string,
  tree2Id: string,
  member2Id: string,
): Promise<string> {
  const linkId = randomUUID()
  await withTestClient((client) =>
    client.query(
      `INSERT INTO "CrossTreeLink" (id, "tree1Id", "member1Id", "tree2Id", "member2Id")
       VALUES ($1, $2, $3, $4, $5)`,
      [linkId, tree1Id, member1Id, tree2Id, member2Id],
    ),
  )
  return linkId
}
