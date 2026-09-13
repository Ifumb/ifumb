// Redirects anonymous visitors of signed-in areas to /login (Auth.js `authorized` callback).
// Not a security boundary on its own: pages and Server Actions re-check the session themselves.
export { auth as proxy } from '@/infrastructure/auth/auth'

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
}
