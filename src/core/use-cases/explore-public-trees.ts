import 'server-only'
import { distinctCulturalTokens } from '@/core/entities/cultural-tokens'
import type { Page } from '@/core/shared/page'
import { PageRequest } from '@/core/shared/value-objects/page-request'
import type {
  CulturalFacets,
  PublicTreeCriteria,
  PublicTreeSummary,
} from '@/core/use-cases/explore-views'
import type { PublicTreeCatalog } from '@/core/use-cases/ports/public-tree-catalog'

export const PUBLIC_TREES_PAGE_SIZE = 20

export type ExplorePublicTreesInput = PublicTreeCriteria & { readonly page: number }

export type PublicTreeExploration = {
  readonly criteria: PublicTreeCriteria
  readonly trees: Page<PublicTreeSummary>
  /** The tribes and ethnicities worth filtering on, taken from every public tree. */
  readonly facets: CulturalFacets
}

type ExplorePublicTreesDeps = { readonly catalog: PublicTreeCatalog }

/**
 * Public trees for anyone, signed in or not.
 * reason: returns the exploration itself rather than a Result — a public listing has no expected
 * failure to report.
 */
export class ExplorePublicTreesUseCase {
  constructor(private readonly deps: ExplorePublicTreesDeps) {}

  async execute(input: ExplorePublicTreesInput): Promise<PublicTreeExploration> {
    const criteria = normalizedCriteria(input)
    const [trees, values] = await Promise.all([
      this.deps.catalog.search(criteria, PageRequest.of(input.page, PUBLIC_TREES_PAGE_SIZE)),
      this.deps.catalog.culturalValues(),
    ])
    const facets = {
      tribes: distinctCulturalTokens(values.tribes),
      ethnicities: distinctCulturalTokens(values.ethnicities),
    }
    return { criteria, trees, facets }
  }
}

function normalizedCriteria({ text, tribe, ethnicity }: PublicTreeCriteria): PublicTreeCriteria {
  const entries = Object.entries({ text, tribe, ethnicity }).flatMap(([key, value]) => {
    const trimmed = value?.trim()
    return trimmed ? [[key, trimmed] as const] : []
  })
  return Object.fromEntries(entries)
}
