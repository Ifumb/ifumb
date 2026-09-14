import { randomUUID } from 'node:crypto'
import { withTestClient } from '@tests/support/test-database'

export type SeedMemberInput = {
  readonly firstName: string
  readonly lastName?: string
  readonly gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'
  readonly birthDate?: string
  readonly birthDateApprox?: boolean
  readonly tribe?: string
  readonly ethnicity?: string
}

export type SeedUnionInput = {
  readonly type: 'MARRIAGE' | 'PARTNERSHIP' | 'BIOLOGICAL'
  readonly parentIds: readonly string[]
  readonly startDate?: string
  readonly children: readonly {
    childId: string
    filiation: 'BIOLOGICAL' | 'ADOPTIVE' | 'RECOGNIZED'
  }[]
}

/** Inserts a member into a tree of the test database; dates are stored exactly as given. */
export async function seedMember(treeId: string, input: SeedMemberInput): Promise<string> {
  const memberId = randomUUID()
  await withTestClient((client) =>
    client.query(
      `INSERT INTO "Member" (id, "firstName", "lastName", gender, "birthDate", "birthDateApprox",
         tribe, ethnicity, "treeId", "updatedAt")
       VALUES ($1, $2, $3, $4::"Gender", $5, $6, $7, $8, $9, now())`,
      [
        memberId,
        input.firstName,
        input.lastName ?? null,
        input.gender ?? null,
        input.birthDate ?? null,
        input.birthDateApprox ?? false,
        input.tribe ?? null,
        input.ethnicity ?? null,
        treeId,
      ],
    ),
  )
  return memberId
}

/** Inserts a union and its children into a tree of the test database. */
export async function seedUnion(treeId: string, input: SeedUnionInput): Promise<string> {
  const unionId = randomUUID()
  await withTestClient(async (client) => {
    await client.query(
      `INSERT INTO "Union" (id, type, "startDate", "parent1Id", "parent2Id", "treeId", "updatedAt")
       VALUES ($1, $2::"UnionType", $3, $4, $5, $6, now())`,
      [
        unionId,
        input.type,
        input.startDate ?? null,
        input.parentIds[0] ?? null,
        input.parentIds[1] ?? null,
        treeId,
      ],
    )
    for (const { childId, filiation } of input.children) {
      await client.query(
        `INSERT INTO "UnionChild" (id, "unionId", "childId", "filiationType")
         VALUES ($1, $2, $3, $4::"Filiation")`,
        [randomUUID(), unionId, childId, filiation],
      )
    }
  })
  return unionId
}
