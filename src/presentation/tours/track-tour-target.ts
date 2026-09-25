import type { Driver } from 'driver.js'

// reason: React Flow déplace ses nœuds par transform, sans événement scroll/resize du navigateur.
export function trackTourTarget(tour: Driver): () => void {
  let frame = 0
  let previous = ''
  const update = () => {
    const bounds = tour.getActiveElement()?.getBoundingClientRect()
    const position = bounds ? [bounds.x, bounds.y, bounds.width, bounds.height].join(':') : ''
    if (position !== previous) {
      previous = position
      tour.refresh()
    }
    frame = requestAnimationFrame(update)
  }
  frame = requestAnimationFrame(update)
  return () => cancelAnimationFrame(frame)
}
