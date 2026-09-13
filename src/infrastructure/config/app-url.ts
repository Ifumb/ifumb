import 'server-only'

const LOCAL_APP_URL = 'http://localhost:3000'

/**
 * Public base URL of the app, used for absolute metadata and sitemap URLs.
 * reason: read at build time as well as at runtime, and falls back to localhost so that the
 * secret-free build gate passes. A deployment must set APP_URL, otherwise the sitemap and canonical
 * URLs point to localhost — listed in the cutover checklist of ADR 0004.
 */
export function appBaseUrl(): URL {
  return new URL(process.env.APP_URL ?? LOCAL_APP_URL)
}
