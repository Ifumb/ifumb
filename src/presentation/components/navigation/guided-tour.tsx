'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Icon } from '@/presentation/components/ui/icon'
import { hasSeenTour } from '@/presentation/tours/tour-storage'
import type { TourId } from '@/presentation/tours/tour-steps'

const AUTOMATIC_TOUR_DELAY_MS = 600

// reason: le cycle de vie annule aussi un import dynamique si la navigation démonte le guide.
export function GuidedTour({ tourId }: Readonly<{ tourId: TourId }>) {
  const stop = useRef<(() => void) | null>(null)
  const generation = useRef<symbol | null>(null)
  const start = useCallback(async () => {
    if (document.querySelector('dialog[open], .driver-popover')) return
    stop.current?.()
    const request = Symbol('tour')
    generation.current = request
    const { startTour } = await import('@/presentation/tours/tour-driver')
    if (request !== generation.current) return
    stop.current = startTour(tourId)
  }, [tourId])

  useEffect(() => {
    const timer = hasSeenTour(tourId)
      ? undefined
      : setTimeout(() => void start(), AUTOMATIC_TOUR_DELAY_MS)
    return () => {
      clearTimeout(timer)
      generation.current = null
      stop.current?.()
      stop.current = null
    }
  }, [start, tourId])

  return (
    <button
      type="button"
      className="tour-help icon-button"
      onClick={() => void start()}
      aria-label="Rejouer la visite guidée"
      title="Rejouer la visite guidée"
    >
      <Icon name="help" />
    </button>
  )
}
