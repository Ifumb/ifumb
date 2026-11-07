import { logoutAction } from '@/app/actions/auth-actions'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { HeaderNavigation } from '@/presentation/components/navigation/header-navigation'
import { BrandLogo } from '@/presentation/components/ui/brand-logo'

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export async function SiteHeader() {
  const user = await currentUserOrNull()
  const unreadCount = user ? await container.getUnreadNotificationCount().execute(user.id) : 0
  return (
    <header className="site-header">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <BrandLogo href={user ? '/dashboard' : '/'} />
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
