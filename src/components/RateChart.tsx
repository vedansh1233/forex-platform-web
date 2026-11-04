import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatLongDay, formatRate, formatShortDay } from '../lib/format'

interface Point {
  date: string
  rate: number
}

interface RateChartProps {
  points: Point[]
  /** e.g. "EUR/USD": used in the accessible label and table caption */
  pair: string
  height?: number
}

const PADDING = { top: 16, right: 64, bottom: 28, left: 8 }

/** Round tick values for an axis spanning [min, max]. */
function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) || 1
  const rawStep = span / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max + step * 1e-9; t += step) {
    ticks.push(Number(t.toPrecision(12)))
  }
  return ticks
}

/**
 * Single-series line chart of an FX rate: 2px line, faint area wash, hairline grid,
 * end dot with the latest value, and a crosshair tooltip (pointer or arrow keys).
 * Values are also available to screen readers as a table.
 */
export function RateChart({ points, pair, height = 260 }: RateChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const tableId = useId()

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const geometry = useMemo(() => {
    if (points.length < 2 || width === 0) return null
    const rates = points.map((p) => p.rate)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const pad = (max - min) * 0.12 || max * 0.01
    const ticks = niceTicks(min - pad, max + pad)
    const yMin = Math.min(ticks[0]!, min - pad)
    const yMax = Math.max(ticks[ticks.length - 1]!, max + pad)

    const innerW = width - PADDING.left - PADDING.right
    const innerH = height - PADDING.top - PADDING.bottom
    const x = (i: number) => PADDING.left + (i / (points.length - 1)) * innerW
    const y = (v: number) => PADDING.top + (1 - (v - yMin) / (yMax - yMin)) * innerH

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rate).toFixed(1)}`).join('')
    const baseline = PADDING.top + innerH
    const area = `${line}L${x(points.length - 1).toFixed(1)},${baseline}L${x(0).toFixed(1)},${baseline}Z`

    // ~4 evenly spaced date labels, always including the first and last
    const labelCount = Math.min(4, points.length)
    const dateLabels = Array.from({ length: labelCount }, (_, k) =>
      Math.round((k / (labelCount - 1)) * (points.length - 1)),
    )

    return { x, y, line, area, ticks: ticks.filter((t) => t >= yMin && t <= yMax), innerW, baseline, dateLabels }
  }, [points, width, height])

  function indexFromPointer(event: PointerEvent<SVGRectElement>) {
    if (!geometry) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    setActive(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))))
  }

  function handleKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const delta = event.key === 'ArrowLeft' ? -1 : 1
      setActive((current) => Math.max(0, Math.min(points.length - 1, (current ?? points.length - 1) + delta)))
    } else if (event.key === 'Escape') {
      setActive(null)
    }
  }

  const last = points[points.length - 1]
  const activePoint = active === null ? null : points[active]

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ height }}>
      {geometry && last && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${pair} rate chart, ${points.length} days. Use left and right arrow keys to inspect values.`}
          aria-describedby={tableId}
          tabIndex={0}
          onKeyDown={handleKey}
          onBlur={() => setActive(null)}
          className="overflow-visible rounded-lg"
        >
          {/* Grid + y-axis labels (right side, as on trading charts) */}
          {geometry.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={PADDING.left + geometry.innerW}
                y1={geometry.y(tick)}
                y2={geometry.y(tick)}
                className="stroke-ink-800"
                strokeWidth={1}
              />
              <text
                x={PADDING.left + geometry.innerW + 8}
                y={geometry.y(tick)}
                dominantBaseline="middle"
                className="fill-ink-400 font-mono text-[11px]"
              >
                {formatRate(tick)}
              </text>
            </g>
          ))}

          {/* x-axis date labels */}
          {geometry.dateLabels.map((index, k) => (
            <text
              key={index}
              x={geometry.x(index)}
              y={height - 8}
              textAnchor={k === 0 ? 'start' : k === geometry.dateLabels.length - 1 ? 'end' : 'middle'}
              className="fill-ink-400 text-[11px]"
            >
              {formatShortDay(points[index]!.date)}
            </text>
          ))}

          <path d={geometry.area} className="fill-accent-400/10" />
          <path
            d={geometry.line}
            fill="none"
            className="stroke-accent-400"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Latest value: end dot (with a surface ring) */}
          <circle
            cx={geometry.x(points.length - 1)}
            cy={geometry.y(last.rate)}
            r={4}
            className="fill-accent-400 stroke-ink-900"
            strokeWidth={2}
          />

          {/* Crosshair */}
          {activePoint && active !== null && (
            <g pointerEvents="none">
              <line
                x1={geometry.x(active)}
                x2={geometry.x(active)}
                y1={PADDING.top}
                y2={geometry.baseline}
                className="stroke-ink-400"
                strokeWidth={1}
              />
              <circle
                cx={geometry.x(active)}
                cy={geometry.y(activePoint.rate)}
                r={5}
                className="fill-accent-400 stroke-ink-900"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Hit area larger than the line */}
          <rect
            x={PADDING.left}
            y={0}
            width={geometry.innerW}
            height={height}
            fill="transparent"
            onPointerMove={indexFromPointer}
            onPointerDown={indexFromPointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}

      {/* Tooltip */}
      {geometry && activePoint && active !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-ink-700 bg-ink-800/95 px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(geometry.x(active) - 70, 0), width - 140),
            width: 140,
          }}
        >
          <div className="text-ink-400">{formatLongDay(activePoint.date)}</div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-ink-100">{formatRate(activePoint.rate)}</div>
        </div>
      )}

      {/* Same data for screen readers */}
      <table id={tableId} className="sr-only">
        <caption>{pair} daily rates</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Rate</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{formatLongDay(p.date)}</td>
              <td>{formatRate(p.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
