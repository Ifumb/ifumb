import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { toMemberSummary, type MemberSummary } from '@/core/use-cases/member-views'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type ListTreeMembersInput = TreeReadInput & {
  /** Narrows the list; absent or blank lists every member. */
  readonly query?: string
}

type ListTreeMembersDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
}

export class ListTreeMembersUseCase {
  constructor(private readonly deps: ListTreeMembersDeps) {}

  async execute(input: ListTreeMembersInput): Promise<Result<MemberSummary[], TreeReadError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const family = await this.deps.families.loadFamily(access.value.listing.tree.id)
    const members = input.query ? family.search(input.query) : family.members()
    return ok(members.map(toMemberSummary))
  }
}
