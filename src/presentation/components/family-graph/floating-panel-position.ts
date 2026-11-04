const VIEWPORT_MARGIN = 16

export type FloatingPanelPosition = {
  readonly top: number
  readonly right: number
  readonly maxHeight: number
}

/**
 * Anchors a floating panel below its trigger button, right-aligned to it, capping its height to
 * whatever room is actually left before the bottom of the viewport (module: mobile parity) — a
 * fixed-position panel does not scroll with the page, so without this a panel taller than the
 * remaining space on a short screen left its lower fields permanently out of reach.
 */
export function floatingPanelPosition(rect: DOMRect): FloatingPanelPosition {
  return {
    top: rect.bottom + 4,
    right: window.innerWidth - rect.right,
    maxHeight: Math.max(160, window.innerHeight - rect.bottom - 4 - VIEWPORT_MARGIN),
  }
}
