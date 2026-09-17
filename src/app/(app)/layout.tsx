import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/auth-actions'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { AccountNav } from '@/presentation/views/account-nav'

export default async function SignedInLayout({ children }: Readonly<{ children: ReactNode }>) {
  const currentUser = await requireCurrentUser()
  const unreadNotificationCount = await container
    .getUnreadNotificationCount()
    .execute(currentUser.id)

  return (
    <>
      <AccountNav
        userName={currentUser.name}
        unreadNotificationCount={unreadNotificationCount}
        logoutAction={logoutAction}
      />
      {children}
    </>
  )
}
