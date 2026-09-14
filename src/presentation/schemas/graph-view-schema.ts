import { z } from 'zod'

/** Upper bound of the generations a lineage view may reach, above or below the pivot. */
export const MAX_LINEAGE_GENERATIONS = 20

/** The legacy pivot view opened on one generation of ancestors and four of descendants. */
export const DEFAULT_LINEAGE_DEPTH = { ancestors: 1, descendants: 4 } as const

/** Query parameter names, shared by the parser, the URL builders and the forms. */
export const GRAPH_VIEW_PARAMS = {
  view: 'view',
  member: 'member',
  ancestors: 'up',
  descendants: 'down',
  first: 'a',
  second: 'b',
} as const

const MEMBER_ID_MAX_LENGTH = 100

export type PairView = 'kinship' | 'ancestors'

export type GraphViewRequest =
  | { readonly kind: 'overview' }
  | {
      readonly kind: 'lineage'
      readonly memberId: string
      readonly ancestors: number
      readonly descendants: number
    }
  | { readonly kind: PairView; readonly firstId: string; readonly secondId: string }
  | {
      readonly kind: 'incomplete'
      readonly view: 'lineage' | PairView
      readonly problem: 'MISSING_MEMBER' | 'SAME_MEMBER'
    }

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

const memberIdParam = z
  .preprocess(firstValue, z.string().trim().min(1).max(MEMBER_ID_MAX_LENGTH).optional())
  .catch(undefined)

const generationsParam = (fallback: number) =>
  z
    .preprocess(firstValue, z.coerce.number().int().min(0))
    .transform((generations) => Math.min(generations, MAX_LINEAGE_GENERATIONS))
    .catch(fallback)

const P = GRAPH_VIEW_PARAMS
const graphViewParamsSchema = z.object({
  [P.view]: z
    .preprocess(firstValue, z.enum(['lineage', 'kinship', 'ancestors']).optional())
    .catch(undefined),
  [P.member]: memberIdParam,
  [P.ancestors]: generationsParam(DEFAULT_LINEAGE_DEPTH.ancestors),
  [P.descendants]: generationsParam(DEFAULT_LINEAGE_DEPTH.descendants),
  [P.first]: memberIdParam,
  [P.second]: memberIdParam,
})

/** The graph view described by the URL; anything unreadable falls back to the whole graph. */
export function parseGraphView(
  searchParams: Record<string, string | string[] | undefined>,
): GraphViewRequest {
  const parsed = graphViewParamsSchema.safeParse(searchParams)
  if (!parsed.success) return { kind: 'overview' }
  const params = parsed.data
  switch (params.view) {
    case 'lineage':
      if (!params.member) return { kind: 'incomplete', view: 'lineage', problem: 'MISSING_MEMBER' }
      return {
        kind: 'lineage',
        memberId: params.member,
        ancestors: params.up,
        descendants: params.down,
      }
    case 'kinship':
    case 'ancestors':
      return pairRequest(params.view, params.a, params.b)
    default:
      return { kind: 'overview' }
  }
}

function pairRequest(view: PairView, firstId?: string, secondId?: string): GraphViewRequest {
  if (!firstId || !secondId) return { kind: 'incomplete', view, problem: 'MISSING_MEMBER' }
  if (firstId === secondId) return { kind: 'incomplete', view, problem: 'SAME_MEMBER' }
  return { kind: view, firstId, secondId }
}
