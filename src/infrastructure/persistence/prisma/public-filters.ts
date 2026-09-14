import 'server-only'
import type { Prisma } from '@/infrastructure/persistence/prisma/generated/client'

/** Trees anyone may browse: public and not archived. */
export const PUBLIC_TREE: Prisma.TreeWhereInput = { visibility: 'PUBLIC', archivedAt: null }

/**
 * A case-insensitive substring match.
 * reason: a plain `contains`, as in the legacy app — cultural fields hold comma-separated lists, so
 * "Peul" also finds "Peul, Malinké". It scans the table; a trigram index would be an additive
 * migration, to be decided separately.
 */
export function containsText(text: string) {
  return { contains: text, mode: 'insensitive' as const }
}
