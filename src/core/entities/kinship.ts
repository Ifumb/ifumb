import type { Family } from '@/core/entities/family'
import type { KinshipPath, KinshipStep } from '@/core/entities/kinship-path'
import type { UnionType } from '@/core/entities/union'
import { MemberId } from '@/core/shared/value-objects/member-id'

export type Branch = 'maternal' | 'paternal'

/** What the second member is to the first, independent of any language. */
export type Kinship =
  | {
      readonly kind: 'blood'
      /** Generations up to the closest common ancestor, then down to the second member. */
      readonly ups: number
      readonly downs: number
      /** Siblings sharing the same union, as opposed to half-siblings sharing one parent. */
      readonly fullSiblings: boolean
      readonly branch: Branch | null
    }
  | { readonly kind: 'partner'; readonly unionType: UnionType }
  | { readonly kind: 'alliance'; readonly links: number }

// Up to the common ancestor, at most one hop between siblings, then down: a line of descent.
const BLOOD_SHAPE = /^U*S?D*$/
const SHAPE_LETTERS: Readonly<Record<KinshipStep['kind'], string>> = {
  UP: 'U',
  DOWN: 'D',
  SIBLING: 'S',
  PARTNER: 'P',
}

/**
 * reason: the legacy service counted a hop between partners as "one up, one down", which named a
 * spouse "demi-frère" and a mother-in-law "tante". A path through a partner, or one going down
 * then up, is an alliance, never a blood relation.
 */
export function classifyKinship(path: KinshipPath, family: Family): Kinship {
  const { steps } = path
  const [first] = steps
  if (steps.length === 1 && first?.kind === 'PARTNER') {
    return { kind: 'partner', unionType: unionTypeOf(family, first.unionId) }
  }
  const shape = steps.map((step) => SHAPE_LETTERS[step.kind]).join('')
  if (steps.length === 0 || !BLOOD_SHAPE.test(shape)) {
    return { kind: 'alliance', links: steps.length }
  }
  return bloodKinship(steps, family)
}

function bloodKinship(steps: readonly KinshipStep[], family: Family): Kinship {
  const count = (kind: KinshipStep['kind']) => steps.filter((step) => step.kind === kind).length
  const siblingHops = count('SIBLING')
  const ups = count('UP') + siblingHops
  const downs = count('DOWN') + siblingHops
  return {
    kind: 'blood',
    ups,
    downs,
    fullSiblings: ups === 1 && downs === 1 && siblingHops === 1,
    branch: branchOf(steps, family),
  }
}

/** The side of the family, from the gender of the parent the path first goes up to. */
function branchOf(steps: readonly KinshipStep[], family: Family): Branch | null {
  const [first] = steps
  if (first?.kind !== 'UP') return null
  const gender = family.findMember(MemberId.fromString(first.memberId))?.details.gender
  if (gender === 'FEMALE') return 'maternal'
  return gender === 'MALE' ? 'paternal' : null
}

function unionTypeOf(family: Family, unionId: string): UnionType {
  const union = family.unions().find((candidate) => candidate.id === unionId)
  if (!union) throw new Error(`Union ${unionId} is not part of this family`)
  return union.type
}
