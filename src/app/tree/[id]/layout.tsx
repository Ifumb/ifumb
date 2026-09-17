import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/auth-actions'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { AccountNav } from '@/presentation/views/account-nav'

/**
 * Tree pages stay readable by anonymous visitors (public trees), so they live outside the (app)
 * group; signed-in readers still get their account navigation here.
 */
export default async function TreeLayout({ children }: Readonly<{ children: ReactNode }>) {
  const currentUser = await currentUserOrNull()
  const unreadNotificationCount = currentUser
    ? await container.getUnreadNotificationCount().execute(currentUser.id)
    : 0

  return (
    <>
      {currentUser && (
        <AccountNav
          userName={currentUser.name}
          unreadNotificationCount={unreadNotificationCount}
          logoutAction={logoutAction}
        />
      )}
      {children}
    </>
  )
}
