/**
 * A same-origin relative path only. Rejects an absolute URL, a protocol-relative `//host/...`, or
 * anything else that could send a signed-in visitor off the site — the `redirect` parameter that
 * carries an invitation link through login/register would otherwise be an open redirect.
 */
export function safeRedirectTarget(candidate: string | null | undefined): string | null {
  if (!candidate) return null
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return null
  return candidate
}
