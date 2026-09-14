import Link from 'next/link'
import type { PaginationViewModel } from '@/presentation/mappers/pagination-view-models'

/** Previous and next links; an end of the listing is plain text, never a dead link. */
export function PaginationView({ pagination }: Readonly<{ pagination: PaginationViewModel }>) {
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-6">
      {pagination.previousHref ? (
        <Link href={pagination.previousHref}>Page précédente</Link>
      ) : (
        <span className="text-earth-bark">Page précédente</span>
      )}
      <p>{pagination.label}</p>
      {pagination.nextHref ? (
        <Link href={pagination.nextHref}>Page suivante</Link>
      ) : (
        <span className="text-earth-bark">Page suivante</span>
      )}
    </nav>
  )
}
