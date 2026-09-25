'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/presentation/components/ui/icon'
import { Button } from '@/presentation/components/ui/button'
import { TOUR_STEPS, type TourId } from '@/presentation/tours/tour-steps'
import { hasSeenTour, rememberTour } from '@/presentation/tours/tour-storage'

// reason: le dialog natif gère focus, Escape et arrière-plan inerte sans dépendance supplémentaire.
export function GuidedTour({ tourId }: Readonly<{ tourId: TourId }>) {
  const [index, setIndex] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const steps = TOUR_STEPS[tourId]
  const step = index === null ? null : steps[index]
  const start = () => {
    trigger.current = document.activeElement as HTMLElement
    setIndex(0)
  }
  const close = () => {
    rememberTour(tourId)
    setIndex(null)
    trigger.current?.focus()
  }

  useEffect(() => {
    if (hasSeenTour(tourId)) return
    const timer = setTimeout(() => {
      if (document.querySelector('dialog[open]')) return
      trigger.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setIndex(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [tourId])

  useEffect(() => {
    const element = dialog.current
    if (!step) {
      element?.close()
      return
    }
    const target = document.querySelector(step.target)
    target?.classList.add('tour-highlight')
    element?.showModal()
    return () => {
      target?.classList.remove('tour-highlight')
    }
  }, [step])

  return (
    <>
      <button
        type="button"
        className="tour-help icon-button"
        onClick={start}
        aria-label="Rejouer la visite guidée"
        title="Rejouer la visite guidée"
      >
        <Icon name="help" />
      </button>
      <dialog
        ref={dialog}
        className="guided-tour"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
      >
        {step && (
          <>
            <button
              type="button"
              className="float-right icon-button"
              onClick={close}
              aria-label="Fermer la visite"
            >
              <Icon name="close" />
            </button>
            <h2 id={titleId} className="pr-8 text-lg font-bold">
              {step.title}
            </h2>
            <p className="mt-3 text-sm text-gray-700">{step.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                Étape {index! + 1} sur {steps.length}
              </span>
              <div className="flex gap-2">
                {index! > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setIndex(index! - 1)}>
                    Retour
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => (index === steps.length - 1 ? close() : setIndex(index! + 1))}
                >
                  {index === steps.length - 1 ? 'Terminer' : 'Suivant'}
                </Button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
