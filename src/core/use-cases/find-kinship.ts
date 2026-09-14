import 'server-only'
import type { Family } from '@/core/entities/family'
import { classifyKinship } from '@/core/entities/kinship'
import { shortestKinshipPath, type KinshipPath } from '@/core/entities/kinship-path'
import type { Member } from '@/core/entities/member'
import { ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import { toGenderedPerson, type KinshipResult } from '@/core/use-cases/kinship-views'
import {
  readableMemberPair,
  type MemberPairDeps,
  type MemberPairError,
  type MemberPairInput,
} from '@/core/use-cases/member-pair-access'

/** What the second member is to the first, and the chain of people linking them. */
export class FindKinshipUseCase {
  constructor(private readonly deps: MemberPairDeps) {}

  async execute(input: MemberPairInput): Promise<Result<KinshipResult, MemberPairError>> {
    const pair = await readableMemberPair(this.deps, input)
    if (!pair.ok) return pair

    const { family, first, second } = pair.value
    const path = shortestKinshipPath(family, first.id, second.id)
    return ok({
      first: toGenderedPerson(first),
      second: toGenderedPerson(second),
      relation: path ? classifyKinship(path, family) : null,
      path: path ? peopleOn(path, family, first) : [],
      unionIds: path ? path.steps.map((step) => step.unionId) : [],
    })
  }
}

function peopleOn(path: KinshipPath, family: Family, first: Member) {
  const reached = path.steps.flatMap((step) => {
    const member = family.findMember(MemberId.fromString(step.memberId))
    return member ? [member] : []
  })
  return [first, ...reached].map(toGenderedPerson)
}
