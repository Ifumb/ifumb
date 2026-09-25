import { driver, type PopoverDOM } from 'driver.js'
import { TOUR_STEPS, type TourId } from './tour-steps'
import { rememberTour } from './tour-storage'
import { FOREIGN_TOUR_TARGET, showForeignTourStep } from './tour-foreign-step'
import { trackTourTarget } from './track-tour-target'

function labelPopover(popover: PopoverDOM) {
  popover.closeButton.setAttribute('aria-label', 'Fermer la visite')
  popover.progress.setAttribute('aria-live', 'polite')
  popover.wrapper.setAttribute('aria-modal', 'true')
}

function labelTarget(element: Element | undefined) {
  // reason: driver.js ajoute aria-expanded même aux cartes et listes non interactives.
  if (!element?.matches('button, a, summary, [role="button"]')) {
    element?.removeAttribute('aria-expanded')
  }
}

// reason: les options du moteur restent ensemble pour comparer directement le thème au legacy.
export function startTour(tourId: TourId): () => void {
  const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const cancellation = new AbortController()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const steps = TOUR_STEPS[tourId]
    .filter((step) => document.querySelector(step.target) || step.target === FOREIGN_TOUR_TARGET)
    .map(({ target, ...popover }) => ({ element: target, popover }))
  if (!steps.length) return () => {}
  const tour = driver({
    animate: !reducedMotion,
    smoothScroll: !reducedMotion,
    overlayOpacity: 0.55,
    popoverClass: 'ifumb-tour-popover',
    showProgress: true,
    progressText: 'Étape {{current}} sur {{total}}',
    nextBtnText: 'Suivant →',
    prevBtnText: '← Retour',
    doneBtnText: 'Terminer',
    steps,
    onPopoverRender: labelPopover,
    onHighlighted: labelTarget,
    onNextClick: () => {
      if (tourId === 'tree-cross-tree' && tour.isFirstStep()) {
        void showForeignTourStep(tour, cancellation.signal)
      } else if (tour.hasNextStep()) tour.moveNext()
      else tour.destroy()
    },
    onDestroyed: () => {
      stopTracking()
      cancellation.abort()
      rememberTour(tourId)
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    },
  })
  const stopTracking = trackTourTarget(tour)
  tour.drive()
  return () => tour.destroy()
}
