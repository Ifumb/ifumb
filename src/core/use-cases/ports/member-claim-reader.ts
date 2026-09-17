import 'server-only'

export type ClaimedMember = { readonly treeId: string; readonly memberId: string }

/**
 * Where a `claimedByUserId` global lookup lives: it is not a fact of one tree's family (what
 * `FamilyReader` loads), but of the account across every tree — matching the database's own
 * `Member.claimedByUserId` column, unique across the whole table, not per tree.
 */
export interface MemberClaimReader {
  findClaimedBy(userId: string): Promise<ClaimedMember | null>
}
