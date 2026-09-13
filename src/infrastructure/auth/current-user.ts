import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth/auth'

export type CurrentUser = {
  readonly id: string
  readonly name: string | null
}

/**
 * Returns the signed-in user, or redirects to the login page.
 * Every protected page and Server Action calls this itself: the proxy alone is not a guarantee,
 * since Server Actions are reachable by direct POST.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) redirect('/login')
  return { id, name: session.user.name ?? null }
}
