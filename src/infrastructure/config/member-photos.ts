// reason: no `server-only` here. next.config.ts imports this file to build `images.remotePatterns`,
// and next.config runs in plain Node, where `server-only` would throw. It holds no secret.

/** Public path of the Supabase Storage bucket the legacy app uploads member photos to. */
export const MEMBER_PHOTOS_PATH = '/storage/v1/object/public/member-photos/'

export type MemberPhotoSource = { readonly origin: string; readonly pathPrefix: string }

/** The member photo source configured for this deployment. */
export function configuredMemberPhotoSource(): MemberPhotoSource | null {
  return memberPhotoSource(process.env.SUPABASE_URL)
}

/**
 * Where member photos are served from, derived from the public Supabase project URL
 * (`SUPABASE_URL`). Null when it is unset or not HTTPS: photos then show as initials.
 */
export function memberPhotoSource(supabaseUrl: string | undefined): MemberPhotoSource | null {
  if (!supabaseUrl || !URL.canParse(supabaseUrl)) return null
  const url = new URL(supabaseUrl)
  if (url.protocol !== 'https:') return null
  return { origin: url.origin, pathPrefix: MEMBER_PHOTOS_PATH }
}
