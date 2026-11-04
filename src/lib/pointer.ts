import type { PointerEvent } from 'react'

/** Sets --mx/--my on the element so a `.spotlight` surface can light up under the pointer. */
export function trackPointer(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  el.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

/** Sets --rx/--ry so a `.tilt` element leans toward the pointer (at most `max` degrees). */
export function tiltToPointer(event: PointerEvent<HTMLElement>, max = 6) {
  if (event.pointerType !== 'mouse') return
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  el.style.setProperty('--rx', `${(-y * max * 2).toFixed(2)}deg`)
  el.style.setProperty('--ry', `${(x * max * 2).toFixed(2)}deg`)
}

/** Resets a `.tilt` element when the pointer leaves. */
export function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--rx', '0deg')
  event.currentTarget.style.setProperty('--ry', '0deg')
}
