import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { SearchField } from '@/presentation/components/ui/search-field'

type MemberSearchFormProps = Readonly<{ treeHref: `/tree/${string}`; query?: string }>

/** A plain GET form: the search works without JavaScript and the URL can be shared. */
export function MemberSearchForm({ treeHref, query }: MemberSearchFormProps) {
  return (
    <form role="search" method="get" action={treeHref} className="flex flex-wrap items-end gap-3">
      <SearchField id="member-search" name="q" label="Rechercher un membre" defaultValue={query} />
      <Button type="submit" variant="secondary">
        Rechercher
      </Button>
      {query && <Link href={treeHref}>Effacer la recherche</Link>}
    </form>
  )
}
