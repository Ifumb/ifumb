import { Button } from '@/presentation/components/ui/button'
import { LinkList } from '@/presentation/views/link-list'

type AccountNavProps = Readonly<{
  userName: string | null
  logoutAction: () => Promise<void>
}>

const ACCOUNT_LINKS = [
  { href: '/dashboard', label: 'Mes arbres' },
  { href: '/account/password', label: 'Changer le mot de passe' },
] as const

export function AccountNav({ userName, logoutAction }: AccountNavProps) {
  return (
    <nav
      aria-label="Compte"
      className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-earth-sand pb-4"
    >
      {userName && <p className="font-medium">Connecté en tant que {userName}</p>}
      <LinkList links={ACCOUNT_LINKS} />
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
