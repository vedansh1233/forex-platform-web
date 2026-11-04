import { useEffect, useRef } from 'react'

/**
 * A number that animates to its value (ease-out, ~1.2 s): from 0 on first render, then from
 * the previous value on each change. Frames are written straight to the DOM (no re-renders);
 * screen readers get the final value only.
 */
export function CountUp({ value, format, duration = 1200, className }: {
  value: number
  format: (n: number) => string
  duration?: number
  className?: string
}) {
  const textRef = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const formatRef = useRef(format)

  useEffect(() => {
    formatRef.current = format
  })

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced) {
      shown.current = value
      el.textContent = formatRef.current(value)
      return
    }
    const start = performance.now()
    const from = shown.current
    const state = { frame: 0 }
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      shown.current = from + (value - from) * (1 - (1 - t) ** 4)
      el.textContent = formatRef.current(shown.current)
      if (t < 1) state.frame = requestAnimationFrame(tick)
    }
    state.frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(state.frame)
  }, [value, duration])

  return (
    <span className={className}>
      <span ref={textRef} aria-hidden>
        {format(0)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
