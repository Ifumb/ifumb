import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { SEARCH_QUERY_MAX_LENGTH } from '@/presentation/schemas/member-search-schema'

type MemberSearchFormProps = Readonly<{ treeHref: `/tree/${string}`; query?: string }>

const INPUT_ID = 'member-search'

/** A plain GET form: the search works without JavaScript and the URL can be shared. */
export function MemberSearchForm({ treeHref, query }: MemberSearchFormProps) {
  return (
    <form role="search" method="get" action={treeHref} className="flex flex-wrap items-end gap-3">
      <SearchField query={query} />
      <Button type="submit" variant="secondary">
        Rechercher
      </Button>
      {query && <Link href={treeHref}>Effacer la recherche</Link>}
    </form>
  )
}

function SearchField({ query }: Readonly<{ query?: string }>) {
  return (
    <div className="space-y-1">
      <label htmlFor={INPUT_ID} className="block font-medium">
        Rechercher un membre
      </label>
      <input
        id={INPUT_ID}
        name="q"
        type="search"
        defaultValue={query}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        className="min-h-11 rounded-md border border-earth-bark bg-white px-3 py-2"
      />
    </div>
  )
}
