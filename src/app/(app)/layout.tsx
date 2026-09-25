import type { ReactNode } from 'react'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'

export default async function SignedInLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireCurrentUser()
  return children
}
