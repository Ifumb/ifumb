import 'server-only'
import { commonAncestorsOf } from '@/core/entities/common-ancestors'
import { ok, type Result } from '@/core/shared/result'
import {
  toCommonAncestorView,
  toGenderedPerson,
  type CommonAncestorsResult,
} from '@/core/use-cases/kinship-views'
import {
  readableMemberPair,
  type MemberPairDeps,
  type MemberPairError,
  type MemberPairInput,
} from '@/core/use-cases/member-pair-access'

/** The ancestors two members of a tree both descend from. */
export class FindCommonAncestorsUseCase {
  constructor(private readonly deps: MemberPairDeps) {}

  async execute(input: MemberPairInput): Promise<Result<CommonAncestorsResult, MemberPairError>> {
    const pair = await readableMemberPair(this.deps, input)
    if (!pair.ok) return pair

    const { family, first, second } = pair.value
    return ok({
      first: toGenderedPerson(first),
      second: toGenderedPerson(second),
      ancestors: commonAncestorsOf(family, first.id, second.id).map(toCommonAncestorView),
    })
  }
}
