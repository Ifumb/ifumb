import { NavLinks, type NavLink } from '@/presentation/components/navigation/nav-links'
import { Button } from '@/presentation/components/ui/button'

type AccountNavProps = Readonly<{
  userName: string | null
  logoutAction: () => Promise<void>
}>

const ACCOUNT_LINKS: readonly NavLink[] = [
  { href: '/dashboard', label: 'Mes arbres' },
  { href: '/account/password', label: 'Changer le mot de passe' },
]

export function AccountNav({ userName, logoutAction }: AccountNavProps) {
  return (
    <nav
      aria-label="Compte"
      className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-earth-sand pb-4"
    >
      {userName && <p className="font-medium">Connecté en tant que {userName}</p>}
      <NavLinks links={ACCOUNT_LINKS} />
      <LogoutButton logoutAction={logoutAction} />
    </nav>
  )
}

function LogoutButton({ logoutAction }: Pick<AccountNavProps, 'logoutAction'>) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary">
        Se déconnecter
      </Button>
    </form>
  )
}
