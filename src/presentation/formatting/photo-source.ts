/** Where member photos may come from; any other URL falls back to the initial. */
export type PhotoSourcePolicy = { readonly origin: string; readonly pathPrefix: string }

/** The photo URL when it points into the allowed bucket, so `next/image` accepts it. */
export function photoSource(url: string | null, policy: PhotoSourcePolicy | null): string | null {
  if (url === null || policy === null || !URL.canParse(url)) return null
  const parsed = new URL(url)
  const allowed = parsed.origin === policy.origin && parsed.pathname.startsWith(policy.pathPrefix)
  return allowed ? parsed.href : null
}
