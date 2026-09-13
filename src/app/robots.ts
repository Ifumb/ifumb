import type { MetadataRoute } from 'next'
import { appBaseUrl } from '@/infrastructure/config/app-url'

/** Keeps crawlers out of the API, signed-in areas and password reset links. */
const PRIVATE_PATHS = ['/api/', '/dashboard', '/account', '/reset-password', '/forgot-password']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    sitemap: new URL('/sitemap.xml', appBaseUrl()).toString(),
  }
}
