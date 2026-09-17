import { NavLinks, type NavLink } from '@/presentation/components/navigation/nav-links'
import { NotificationBadge } from '@/presentation/components/navigation/notification-badge'
import { Button } from '@/presentation/components/ui/button'

type AccountNavProps = Readonly<{
  userName: string | null
  unreadNotificationCount: number
  logoutAction: () => Promise<void>
}>

const ACCOUNT_LINKS: readonly NavLink[] = [
  { href: '/dashboard', label: 'Mes arbres' },
  { href: '/contact-requests', label: 'Demandes de contact' },
  { href: '/account/password', label: 'Changer le mot de passe' },
]

export function AccountNav({ userName, unreadNotificationCount, logoutAction }: AccountNavProps) {
  return (
    <nav
      aria-label="Compte"
      className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-earth-sand pb-4"
    >
      {userName && <p className="font-medium">Connecté en tant que {userName}</p>}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <NavLinks links={ACCOUNT_LINKS} />
        <NotificationBadge initialUnreadCount={unreadNotificationCount} />
      </div>
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
