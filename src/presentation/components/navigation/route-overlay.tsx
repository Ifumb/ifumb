'use client'

import { useEffect, useRef, type ReactNode, type PointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/presentation/components/ui/icon'

type RouteOverlayProps = Readonly<{
  children: ReactNode
  title: string
  variant?: 'modal' | 'drawer' | 'notifications'
}>

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function RouteOverlay({ children, title, variant = 'modal' }: RouteOverlayProps) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  useModalLifecycle(dialog)
  const dismissBackdrop = (event: PointerEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      router.back()
  }
  return (
    <dialog
      ref={dialog}
      aria-label={title}
      className={`route-overlay route-overlay-${variant}`}
      onPointerDown={dismissBackdrop}
      onCancel={(event) => {
        event.preventDefault()
        router.back()
      }}
    >
      <button
        type="button"
        className="overlay-close icon-button"
        aria-label="Fermer"
        onClick={() => router.back()}
      >
        <Icon name="close" />
      </button>
      <div className="overlay-content">{children}</div>
    </dialog>
  )
}

function useModalLifecycle(dialog: React.RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const trigger = document.activeElement
    const element = dialog.current
    element?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [dialog])
}
