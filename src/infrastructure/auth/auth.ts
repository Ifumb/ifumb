import 'server-only'
import NextAuth, {
  CredentialsSignin,
  type DefaultSession,
  type User as SessionUser,
} from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { container } from '@/infrastructure/di/container'
import { accountKey } from '@/infrastructure/rate-limiting/account-key'
import { clientIpFrom } from '@/infrastructure/http/client-ip'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

/** Same lifetime as the legacy refresh token. */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export const TOO_MANY_SIGN_IN_ATTEMPTS_CODE = 'rate_limited'

/** Sign-in refused because an attempt budget is exhausted, before any password is checked. */
export class TooManySignInAttempts extends CredentialsSignin {
  code = TOO_MANY_SIGN_IN_ATTEMPTS_CODE
}

async function authorizeWithPassword(
  credentials: Partial<Record<'email' | 'password', unknown>>,
  request: Request,
): Promise<SessionUser | null> {
  const { email, password } = credentials
  if (typeof email !== 'string' || typeof password !== 'string') return null

  // reason: limited here rather than in loginAction, because Auth.js also exposes
  // POST /api/auth/callback/credentials, which reaches authorize without going through the form.
  const allowed = await container.allowsAttempt([
    { policy: 'loginByIp', subject: clientIpFrom(request.headers) },
    { policy: 'loginByEmail', subject: accountKey(email) },
  ])
  if (!allowed) throw new TooManySignInAttempts()

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
    // An exhausted budget is kept as a security signal, without the email or IP it concerns.
    error: (error) => {
      if (error instanceof TooManySignInAttempts) {
        console.warn('Sign-in refused: attempt budget exhausted')
        return
      }
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
