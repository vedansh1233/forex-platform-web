import type { PointerEvent } from 'react'

/** Sets --mx/--my on the element so a `.spotlight` surface can light up under the pointer. */
export function trackPointer(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  el.style.setProperty('--my', `${event.clientY - rect.top}px`)
}
