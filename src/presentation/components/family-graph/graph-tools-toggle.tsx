'use client'

import { useState, type ReactNode } from 'react'
import { Icon } from '@/presentation/components/ui/icon'

type GraphToolsToggleProps = Readonly<{ children: ReactNode }>

/**
 * On a phone, the graph's tool buttons (module: mobile parity) collapse behind this single toggle
 * instead of permanently covering the canvas; on a wide screen the toggle itself stays hidden and
 * the tools show as before. Plain state and a class, not a native `<details>`: current browsers
 * give a closed `<details>`'s content `content-visibility: hidden` internally, which an author
 * override on the content itself cannot defeat regardless of its own `display`.
 */
export function GraphToolsToggle({ children }: GraphToolsToggleProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="graph-tools-toggle">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="graph-tools-panel"
        onClick={() => setOpen((value) => !value)}
        className="graph-tools-toggle-button"
      >
        <Icon name="tools" size={14} />
        Outils
      </button>
      <div
        id="graph-tools-panel"
        className={open ? 'graph-side-tools' : 'graph-side-tools graph-side-tools-collapsed'}
      >
        {children}
      </div>
    </div>
  )
}
