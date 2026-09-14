import 'server-only'
import { culturalTokens, distinctCulturalTokens } from '@/core/entities/cultural-tokens'
import type { PublicMemberSummary, PublicTreeSummary } from '@/core/use-cases/explore-views'
import type { Prisma } from '@/infrastructure/persistence/prisma/generated/client'
import { optionalPartialDate } from '@/infrastructure/persistence/prisma/mappers/family-mapper'

export const PUBLIC_TREE_ROW_INCLUDE = {
  owner: { select: { firstName: true, lastName: true } },
  _count: { select: { members: true } },
  members: { select: { tribe: true, ethnicity: true } },
} as const satisfies Prisma.TreeInclude

export const PUBLIC_MEMBER_ROW_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  birthPlace: true,
  tribe: true,
  ethnicity: true,
  clan: true,
  originRegion: true,
  tree: { select: { id: true, name: true } },
} as const satisfies Prisma.MemberSelect

type PublicTreeRow = Prisma.TreeGetPayload<{ include: typeof PUBLIC_TREE_ROW_INCLUDE }>
type PublicMemberRow = Prisma.MemberGetPayload<{ select: typeof PUBLIC_MEMBER_ROW_SELECT }>

export function toPublicTreeSummary(row: PublicTreeRow): PublicTreeSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    owner: row.owner,
    memberCount: row._count.members,
    tribes: distinctCulturalTokens(row.members.map((member) => member.tribe)),
    ethnicities: distinctCulturalTokens(row.members.map((member) => member.ethnicity)),
  }
}

export function toPublicMemberSummary(row: PublicMemberRow): PublicMemberSummary {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    birthDate: optionalPartialDate(row.birthDate),
    birthPlace: row.birthPlace,
    tribes: culturalTokens(row.tribe),
    ethnicities: culturalTokens(row.ethnicity),
    clan: row.clan,
    originRegion: row.originRegion,
    tree: row.tree,
  }
}
