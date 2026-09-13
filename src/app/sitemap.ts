import type { MetadataRoute } from 'next'
import { appBaseUrl } from '@/infrastructure/config/app-url'

/** Public, indexable entry points only; signed-in areas and one-time links are left out. */
const PUBLIC_PATHS = ['/', '/register', '/login'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, appBaseUrl()).toString(),
    changeFrequency: 'monthly',
  }))
}
