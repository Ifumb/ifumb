import type { NextConfig } from 'next'
import { memberPhotoSource } from './src/infrastructure/config/member-photos'

const isDevelopment = process.env.NODE_ENV === 'development'

// CSP without nonces (skill security-robustness.md § 2.1): keeps static rendering. Next.js injects
// inline scripts, hence 'unsafe-inline'; 'unsafe-eval' is only needed by the dev server.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const TWO_YEARS_IN_SECONDS = 63_072_000

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: `max-age=${TWO_YEARS_IN_SECONDS}; includeSubDomains; preload`,
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

// Member photos stay in the legacy Supabase Storage bucket. `next/image` serves them from this
// origin (so the CSP keeps `img-src 'self'`), and only fetches that bucket. SUPABASE_URL is read at
// BUILD time here; without it, photos show as initials.
const memberPhotos = memberPhotoSource(process.env.SUPABASE_URL)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: memberPhotos
      ? [new URL(`${memberPhotos.origin}${memberPhotos.pathPrefix}**`)]
      : [],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
