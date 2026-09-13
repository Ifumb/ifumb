import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/auth-actions'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { AccountNav } from '@/presentation/views/account-nav'

export default async function SignedInLayout({ children }: Readonly<{ children: ReactNode }>) {
  const currentUser = await requireCurrentUser()

  return (
    <>
      <AccountNav userName={currentUser.name} logoutAction={logoutAction} />
      {children}
    </>
  )
}
