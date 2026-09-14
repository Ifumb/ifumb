'use client'

import { useReactFlow } from '@xyflow/react'
import { useCallback, type FocusEvent } from 'react'
import { transitionDuration } from '@/presentation/components/family-graph/use-graph-centring'

type Size = { readonly width: number; readonly height: number }

const PAN_DURATION_MS = 200

/**
 * Keeps a node reached with the keyboard in view (WCAG 2.4.11): Tab moves through the member links
 * in layout order, and the viewport follows instead of leaving the focus outside the canvas.
 */
export function usePanToFocusedNode(x: number, y: number, size: Size) {
  const { setCenter, getZoom } = useReactFlow()

  return useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.matches(':focus-visible')) return
      void setCenter(x + size.width / 2, y + size.height / 2, {
        zoom: getZoom(),
        duration: transitionDuration(PAN_DURATION_MS),
      })
    },
    [setCenter, getZoom, x, y, size],
  )
}
