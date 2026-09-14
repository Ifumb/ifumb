import 'server-only'
import { pageOf, type Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type { PublicMemberSummary } from '@/core/use-cases/explore-views'
import type { PublicMemberDirectory } from '@/core/use-cases/ports/public-member-directory'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import {
  PUBLIC_MEMBER_ROW_SELECT,
  toPublicMemberSummary,
} from '@/infrastructure/persistence/prisma/mappers/explore-mapper'
import { containsText, PUBLIC_TREE } from '@/infrastructure/persistence/prisma/public-filters'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const SEARCHED_FIELDS = [
  'firstName',
  'lastName',
  'ethnicity',
  'tribe',
  'clan',
  'originRegion',
] as const

export class PrismaPublicMemberDirectory implements PublicMemberDirectory {
  constructor(private readonly db: PrismaExecutor) {}

  /**
   * reason: one query with one count, where the legacy service paged public and "discoverable"
   * members separately and reported the page size as the total. Archived trees are left out, as
   * they are from the public tree listing.
   */
  async search(query: string, page: PageRequest): Promise<Page<PublicMemberSummary>> {
    const where: Prisma.MemberWhereInput = {
      tree: PUBLIC_TREE,
      OR: SEARCHED_FIELDS.map((field) => ({ [field]: containsText(query) })),
    }
    const [rows, total] = await Promise.all([
      this.db.member.findMany({
        where,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
        skip: page.offset,
        take: page.size,
        select: PUBLIC_MEMBER_ROW_SELECT,
      }),
      this.db.member.count({ where }),
    ])
    return pageOf(rows.map(toPublicMemberSummary), total, page)
  }
}
