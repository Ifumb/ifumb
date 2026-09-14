import { NavLinks, type NavLink } from '@/presentation/components/navigation/nav-links'

const EXPLORE_LINKS: readonly NavLink[] = [
  { href: '/explore', label: 'Arbres' },
  { href: '/explore/members', label: 'Membres' },
]

/** Title and navigation shared by the two explore pages. */
export function ExploreHeaderView() {
  return (
    <header className="space-y-4">
      <h1 className="text-3xl font-bold">Explorer</h1>
      <p className="max-w-prose">
        Parcourez les arbres publics et retrouvez leurs membres. Les arbres privés n’apparaissent
        jamais ici.
      </p>
      <nav aria-label="Explorer">
        <NavLinks links={EXPLORE_LINKS} />
      </nav>
    </header>
  )
}
