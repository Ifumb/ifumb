import { NavLinks, type NavLink } from '@/presentation/components/navigation/nav-links'

const EXPLORE_LINKS: readonly NavLink[] = [
  { href: '/explore', label: 'Arbres publics' },
  { href: '/explore/members', label: 'Membres' },
]

export function ExploreHeaderView() {
  return (
    <header className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Explorer</h1>
        <p className="text-sm text-gray-500">
          Découvrez les arbres généalogiques et retrouvez des membres partagés par la communauté.
        </p>
      </div>
      <nav aria-label="Explorer" className="explore-tabs">
        <NavLinks links={EXPLORE_LINKS} />
      </nav>
    </header>
  )
}
