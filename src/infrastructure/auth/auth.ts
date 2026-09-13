import 'server-only'
import NextAuth, {
  CredentialsSignin,
  type DefaultSession,
  type User as SessionUser,
} from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { container } from '@/infrastructure/di/container'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

/** Same lifetime as the legacy refresh token. */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

async function authorizeWithPassword(
  credentials: Partial<Record<'email' | 'password', unknown>>,
): Promise<SessionUser | null> {
  const { email, password } = credentials
  if (typeof email !== 'string' || typeof password !== 'string') return null

  const result = await container.authenticateUser().execute({ email, password })
  if (!result.ok) return null

  const profile = result.value
  return {
    id: profile.id,
    email: profile.email,
    name: `${profile.firstName} ${profile.lastName}`,
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: authorizeWithPassword,
    }),
  ],
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: '/login' },
  logger: {
    // reason: a mistyped password is an expected outcome, already answered in the login form;
    // logging it as an error with a stack trace would flood production logs on every typo.
    error: (error) => {
      if (error instanceof CredentialsSignin) return
      console.error(error)
    },
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub },
    }),
    authorized: ({ auth: session }) => Boolean(session?.user),
  },
})
