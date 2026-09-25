import Link from 'next/link'
import { logoutAction } from '@/app/actions/auth-actions'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { HeaderNavigation } from '@/presentation/components/navigation/header-navigation'

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export async function SiteHeader() {
  const user = await currentUserOrNull()
  const unreadCount = user ? await container.getUnreadNotificationCount().execute(user.id) : 0
  return (
    <header className="site-header">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          prefetch={false}
          href={user ? '/dashboard' : '/'}
          className="flex shrink-0 items-center gap-2 no-underline"
        >
          <span className="text-xl font-bold tracking-tight text-brand">IFUMB</span>
          <span className="hidden text-xs font-normal text-gray-500 sm:block">
            Réseau généalogique culturel
          </span>
        </Link>
        <HeaderNavigation
          userName={user?.name ?? null}
          signedIn={!!user}
          unreadCount={unreadCount}
          logoutAction={logoutAction}
        />
      </div>
    </header>
  )
}
