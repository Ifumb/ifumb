/** Node sizes shared by the server layout and the client rendering, which must agree. */
export const MEMBER_NODE_SIZE = { width: 168, height: 136 } as const
export const UNION_NODE_SIZE = { width: 48, height: 48 } as const

/** Extra height reserved under a member card for its row of cross-tree bridge buttons (module 3.3). */
export const BRIDGE_BUTTONS_HEIGHT = 36

/** A member node's full height, wider than `MEMBER_NODE_SIZE.height` once it has a bridge to show. */
export function memberNodeHeight(bridgeLinkCount: number): number {
  return MEMBER_NODE_SIZE.height + (bridgeLinkCount > 0 ? BRIDGE_BUTTONS_HEIGHT : 0)
}

/**
 * The opening view: fits the family, but never below a zoom where names stay readable. A large
 * tree then opens on its middle, and the "Ajuster la vue" control still shows it whole.
 */
export const OVERVIEW_FIT = { padding: 0.2, minZoom: 0.6, maxZoom: 1 } as const

/** A centred member and their close relatives, never zoomed in beyond the natural size. */
export const CENTRED_FIT = { padding: 0.2, maxZoom: 1 } as const

/** Height of the graph canvas; its width follows the page. */
export const GRAPH_CANVAS_HEIGHT = 'min(70vh, 720px)'
