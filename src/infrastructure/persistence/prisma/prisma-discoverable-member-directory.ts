import 'server-only'
import { culturalTokens } from '@/core/entities/cultural-tokens'
import { pageOf, type Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type {
  DiscoverableMemberDirectory,
  DiscoverableMemberLookup,
  DiscoverableMemberSummary,
} from '@/core/use-cases/ports/discoverable-member-directory'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { optionalPartialDate } from '@/infrastructure/persistence/prisma/mappers/family-mapper'
import { containsText, DISCOVERABLE_TREE } from '@/infrastructure/persistence/prisma/public-filters'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const SEARCHED_FIELDS = ['firstName', 'lastName', 'ethnicity', 'originRegion'] as const

const DISCOVERABLE_MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  ethnicity: true,
  originRegion: true,
} as const satisfies Prisma.MemberSelect

type DiscoverableMemberRow = Prisma.MemberGetPayload<{ select: typeof DISCOVERABLE_MEMBER_SELECT }>

/**
 * reason: never selects a tree name, id or photo — a discoverable result is reduced to what a
 * stranger may ever see of a private member (module 3.1, carried over from the legacy service).
 */
export class PrismaDiscoverableMemberDirectory implements DiscoverableMemberDirectory {
  constructor(private readonly db: PrismaExecutor) {}

  async search(query: string, page: PageRequest): Promise<Page<DiscoverableMemberSummary>> {
    const where: Prisma.MemberWhereInput = {
      tree: DISCOVERABLE_TREE,
      discoverable: true,
      OR: SEARCHED_FIELDS.map((field) => ({ [field]: containsText(query) })),
    }
    const [rows, total] = await Promise.all([
      this.db.member.findMany({
        where,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
        skip: page.offset,
        take: page.size,
        select: DISCOVERABLE_MEMBER_SELECT,
      }),
      this.db.member.count({ where }),
    ])
    return pageOf(rows.map(toSummary), total, page)
  }

  async findDiscoverable(memberId: string): Promise<DiscoverableMemberLookup | null> {
    const member = await this.db.member.findUnique({
      where: { id: memberId },
      select: { discoverable: true, tree: { select: { id: true, ownerId: true } } },
    })
    if (!member) return null
    return { treeId: member.tree.id, ownerId: member.tree.ownerId, discoverable: member.discoverable }
  }
}

function toSummary(row: DiscoverableMemberRow): DiscoverableMemberSummary {
  return {
    memberId: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    birthDate: optionalPartialDate(row.birthDate),
    ethnicities: culturalTokens(row.ethnicity),
    originRegion: row.originRegion,
  }
}
