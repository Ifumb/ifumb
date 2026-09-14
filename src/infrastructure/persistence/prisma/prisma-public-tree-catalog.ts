import 'server-only'
import { pageOf, type Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type {
  PublicTreeCriteria,
  PublicTreeSummary,
  RawCulturalValues,
} from '@/core/use-cases/explore-views'
import type { PublicTreeCatalog } from '@/core/use-cases/ports/public-tree-catalog'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import {
  PUBLIC_TREE_ROW_INCLUDE,
  toPublicTreeSummary,
} from '@/infrastructure/persistence/prisma/mappers/explore-mapper'
import { containsText, PUBLIC_TREE } from '@/infrastructure/persistence/prisma/public-filters'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaPublicTreeCatalog implements PublicTreeCatalog {
  constructor(private readonly db: PrismaExecutor) {}

  async search(criteria: PublicTreeCriteria, page: PageRequest): Promise<Page<PublicTreeSummary>> {
    const where = publicTreesMatching(criteria)
    const [rows, total] = await Promise.all([
      this.db.tree.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: page.offset,
        take: page.size,
        include: PUBLIC_TREE_ROW_INCLUDE,
      }),
      this.db.tree.count({ where }),
    ])
    return pageOf(rows.map(toPublicTreeSummary), total, page)
  }

  async culturalValues(): Promise<RawCulturalValues> {
    const rows = await this.db.member.findMany({
      where: { tree: PUBLIC_TREE },
      select: { tribe: true, ethnicity: true },
      distinct: ['tribe', 'ethnicity'],
    })
    return { tribes: rows.map((row) => row.tribe), ethnicities: rows.map((row) => row.ethnicity) }
  }
}

/**
 * reason: the legacy query spread two `members` conditions into one object, so a tribe filter was
 * silently dropped as soon as an ethnicity was chosen. Every criterion is its own `AND` clause here.
 */
function publicTreesMatching({
  text,
  tribe,
  ethnicity,
}: PublicTreeCriteria): Prisma.TreeWhereInput {
  return {
    AND: [
      PUBLIC_TREE,
      ...(text ? [treeOrOwnerNamed(text)] : []),
      ...(tribe ? [{ members: { some: { tribe: containsText(tribe) } } }] : []),
      ...(ethnicity ? [{ members: { some: { ethnicity: containsText(ethnicity) } } }] : []),
    ],
  }
}

function treeOrOwnerNamed(text: string): Prisma.TreeWhereInput {
  return {
    OR: [
      { name: containsText(text) },
      { owner: { firstName: containsText(text) } },
      { owner: { lastName: containsText(text) } },
    ],
  }
}
