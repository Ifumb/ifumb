import { Family } from '@/core/entities/family'
import type { Gender, Member } from '@/core/entities/member'
import type { Union, UnionType } from '@/core/entities/union'
import { aMember, aUnion, memberId } from '@tests/support/family-fixtures'

/** A member named after its id, which keeps relation tests readable. */
export function person(id: string, gender: Gender | null = null): Member {
  return aMember({ id: memberId(id), firstName: id, lastName: null, gender })
}

export function unionOf(
  id: string,
  parents: readonly string[],
  children: readonly string[],
  type: UnionType = 'MARRIAGE',
): Union {
  const [parent1, parent2] = parents
  return aUnion({
    id,
    type,
    parent1Id: parent1 ? memberId(parent1) : null,
    parent2Id: parent2 ? memberId(parent2) : null,
    children: children.map((child) => ({ childId: memberId(child), filiation: 'BIOLOGICAL' })),
  })
}

/**
 * Three generations and an in-law:
 * grandpa + grandma → dad, aunt · dad + mum → me, sister · aunt + uncle → cousin ·
 * mum's parents granny2 → mum · half-brother: dad + other → half
 */
export function extendedFamily(): Family {
  return Family.of(
    [
      person('grandpa', 'MALE'),
      person('grandma', 'FEMALE'),
      person('granny2', 'FEMALE'),
      person('dad', 'MALE'),
      person('mum', 'FEMALE'),
      person('aunt', 'FEMALE'),
      person('uncle', 'MALE'),
      person('other', 'FEMALE'),
      person('me', 'MALE'),
      person('sister', 'FEMALE'),
      person('cousin', null),
      person('half', 'MALE'),
    ],
    [
      unionOf('u_grand', ['grandpa', 'grandma'], ['dad', 'aunt']),
      unionOf('u_granny2', ['granny2'], ['mum'], 'BIOLOGICAL'),
      unionOf('u_parents', ['dad', 'mum'], ['me', 'sister']),
      unionOf('u_aunt', ['aunt', 'uncle'], ['cousin'], 'PARTNERSHIP'),
      unionOf('u_other', ['dad', 'other'], ['half']),
    ],
  )
}
