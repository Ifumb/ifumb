import 'server-only'
import type { Prisma } from '@/infrastructure/persistence/prisma/generated/client'

/** Trees anyone may browse: public and not archived. */
export const PUBLIC_TREE: Prisma.TreeWhereInput = { visibility: 'PUBLIC', archivedAt: null }

/**
 * Trees whose discoverable members may surface in global search: private and shared alike, not
 * archived. reason: the legacy app excluded `SHARED` trees here (module 3.1, decision 2) — an
 * inconsistency with its own suggestion-matching pool, which never excluded them.
 */
export const DISCOVERABLE_TREE: Prisma.TreeWhereInput = {
  visibility: { in: ['PRIVATE', 'SHARED'] },
  archivedAt: null,
}

/**
 * A case-insensitive substring match.
 * reason: a plain `contains`, as in the legacy app — cultural fields hold comma-separated lists, so
 * "Peul" also finds "Peul, Malinké". It scans the table; a trigram index would be an additive
 * migration, to be decided separately.
 */
export function containsText(text: string) {
  return { contains: text, mode: 'insensitive' as const }
}
