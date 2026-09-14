import 'server-only'
import type { Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type {
  PublicTreeCriteria,
  PublicTreeSummary,
  RawCulturalValues,
} from '@/core/use-cases/explore-views'

/** Read side of the trees anyone may browse: public and not archived. */
export interface PublicTreeCatalog {
  /** Matching trees, most recently created first; every criterion given must hold. */
  search(criteria: PublicTreeCriteria, page: PageRequest): Promise<Page<PublicTreeSummary>>
  /** Tribes and ethnicities recorded on the members of all public trees. */
  culturalValues(): Promise<RawCulturalValues>
}
