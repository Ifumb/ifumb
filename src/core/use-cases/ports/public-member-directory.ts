import 'server-only'
import type { Page } from '@/core/shared/page'
import type { PageRequest } from '@/core/shared/value-objects/page-request'
import type { PublicMemberSummary } from '@/core/use-cases/explore-views'

/** Read side of the members of public, non-archived trees. */
export interface PublicMemberDirectory {
  /**
   * Members whose first name, last name, ethnicity, tribe, clan or region of origin contains the
   * query, ignoring case, in name order.
   */
  search(query: string, page: PageRequest): Promise<Page<PublicMemberSummary>>
}
