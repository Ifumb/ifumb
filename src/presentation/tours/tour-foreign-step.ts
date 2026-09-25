import type { Driver } from 'driver.js'

const BRANCH_WAIT_MS = 15_000
export const FOREIGN_TOUR_TARGET = '[data-tour-member="foreign"]'

// reason: attendre le rendu autorisé de la branche évite une bulle centrale sans cible.
function waitForForeignMember(signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = (found: boolean) => {
      observer.disconnect()
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      resolve(found)
    }
    const cancel = () => finish(false)
    const observer = new MutationObserver(() => {
      if (document.querySelector(FOREIGN_TOUR_TARGET)) finish(true)
    })
    const timer = setTimeout(() => finish(false), BRANCH_WAIT_MS)
    observer.observe(document.body, { childList: true, subtree: true })
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted || document.querySelector(FOREIGN_TOUR_TARGET)) finish(!signal.aborted)
  })
}

// reason: le guide utilise le bouton existant ; la requête reste soumise aux droits serveur.
export async function showForeignTourStep(tour: Driver, signal: AbortSignal) {
  if (document.querySelector(FOREIGN_TOUR_TARGET)) return tour.moveNext()
  const button = document.querySelector<HTMLButtonElement>(
    '[data-tour-member="bridge"] button[aria-expanded="false"]',
  )
  const next = document.querySelector<HTMLButtonElement>('.driver-popover-next-btn')
  if (!button || !next || next.disabled) return
  next.disabled = true
  next.textContent = 'Chargement…'
  const pending = waitForForeignMember(signal)
  button.click()
  const ready = await pending
  if (signal.aborted || !tour.isActive()) return
  if (ready) return tour.moveNext()
  next.disabled = false
  next.textContent = 'Réessayer →'
  const description = document.querySelector('.driver-popover-description')
  if (description) {
    description.textContent =
      'Cette branche n’est pas disponible pour le moment. Réessayez ou fermez la visite.'
    description.setAttribute('role', 'status')
  }
}
