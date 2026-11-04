'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Dismisses a floating popover (module: mobile/keyboard parity) on Escape or a pointerdown outside
 * both its trigger button and its portaled panel — the standard expectation for a non-modal
 * popover, at the keyboard (Escape) and on a touch screen (tapping away) alike. The graph tool
 * popovers portal to `document.body`, so "outside" is judged against these two refs, not React's
 * own tree.
 *
 * The pointerdown listener runs on the capture phase: React Flow's own pane stops a plain
 * `mousedown`'s bubbling (its pan/zoom handling), which would otherwise make tapping the graph
 * itself — its single largest surface, especially on a phone — fail to close whatever is open.
 *
 * A click inside an open `GraphToolSelect` listbox never dismisses either, even though that
 * listbox portals to `document.body` on its own, outside `panelRef` — otherwise picking a member
 * from it would close the whole panel before its `onChange` ever ran. Same reasoning for Escape:
 * `GraphToolSelect` already closes just the listbox on Escape and calls `preventDefault()` — this
 * only closes the panel itself when nothing nested has claimed the key first.
 */
export function usePopoverDismissal(
  open: boolean,
  buttonRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('[role="listbox"]')) return
      onDismiss()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) onDismiss()
    }
    document.addEventListener('mousedown', onPointerDown, { capture: true })
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown, { capture: true })
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, buttonRef, panelRef, onDismiss])
}
