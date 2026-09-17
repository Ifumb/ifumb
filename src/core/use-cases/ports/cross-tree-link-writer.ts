import 'server-only'
import type { CrossTreeLink } from '@/core/entities/cross-tree-link'

/** Write side of established cross-tree links. */
export interface CrossTreeLinkWriter {
  create(link: CrossTreeLink): Promise<void>
}
