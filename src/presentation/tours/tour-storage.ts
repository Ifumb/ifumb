import type { TourId } from './tour-steps'

export function hasSeenTour(id: TourId): boolean {
  try {
    return localStorage.getItem(`tour_seen:${id}`) === 'true'
  } catch {
    // reason: si le stockage est bloqué, éviter de répéter automatiquement l’aide à chaque visite.
    return true
  }
}

export function rememberTour(id: TourId): void {
  try {
    localStorage.setItem(`tour_seen:${id}`, 'true')
  } catch {
    // reason: cette préférence locale facultative ne doit jamais empêcher de fermer l’aide.
    /* La visite reste disponible via le bouton d’aide. */
  }
}
