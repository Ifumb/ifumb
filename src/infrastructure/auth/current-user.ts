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
  const currentUser = await currentUserOrNull()
  if (!currentUser) redirect('/login')
  return currentUser
}

/** The signed-in user on pages that anonymous visitors may also read; null when signed out. */
export async function currentUserOrNull(): Promise<CurrentUser | null> {
  const session = await auth()
  const id = session?.user?.id
  return id ? { id, name: session.user.name ?? null } : null
}
