import { useQueries } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api, queryKeys } from '../../api/endpoints'
import { SourceBadge } from '../SourceBadge'
import { Card, ErrorAlert, Segmented } from '../ui'
import { CURRENCIES, currencyName } from '../../lib/currencies'
import { correlationMatrix, currencyStrength, type UsdSeries } from '../../lib/fx'
import { formatPercent } from '../../lib/format'

const PERIODS = [
  { value: 30, label: '1M' },
  { value: 90, label: '3M' },
  { value: 180, label: '6M' },
]

const NON_USD = CURRENCIES.filter((c) => c !== 'USD')

/**
 * Currency strength and correlation, both derived client-side from the USD-based history of
 * each currency (7 history requests that the backend caches for an hour).
 */
export function StrengthCorrelation() {
  const [days, setDays] = useState(90)

  const results = useQueries({
    queries: NON_USD.map((c) => ({
      queryKey: queryKeys.history('USD', c, days),
      queryFn: () => api.rateHistory('USD', c, days),
      staleTime: 10 * 60_000,
    })),
  })

  const error = results.find((r) => r.isError)?.error
  const loaded = results.every((r) => r.data)
  const source = results[0]?.data?.source

  const histories = loaded ? results.map((r) => r.data!) : null
  // useQueries returns a new array every render; key the memo on the data timestamps instead
  const version = results.map((r) => r.dataUpdatedAt).join()

  const { strength, correlation } = useMemo(() => {
    if (!histories) return { strength: [], correlation: [] as number[][] }
    const series: UsdSeries = {}
    histories.forEach((h, i) => {
      series[NON_USD[i]!] = new Map(h.points.map((p) => [p.date, p.rate]))
    })
    return {
      strength: currencyStrength(series, CURRENCIES),
      correlation: correlationMatrix(series, NON_USD),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  return (
    <section className="flex flex-col gap-4" aria-labelledby="analysis-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="analysis-heading" className="text-lg font-semibold">
          Market analysis
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {source && <SourceBadge source={source} />}
          <Segmented label="Period" options={PERIODS} value={days} onChange={setDays} />
        </div>
      </div>

      {error && <ErrorAlert>{error.message}</ErrorAlert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold">Currency strength</h3>
            <p className="mt-0.5 text-sm text-ink-400">Average change of each currency against the 7 others over the period.</p>
          </div>
          {!loaded ? <div className="h-72 animate-pulse rounded-lg bg-ink-800" aria-label="Loading" /> : <StrengthBars data={strength} />}
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold">Correlation</h3>
            <p className="mt-0.5 text-sm text-ink-400">How the daily moves of each currency against USD go together: +1 always together, −1 always opposite.</p>
          </div>
          {!loaded ? <div className="h-72 animate-pulse rounded-lg bg-ink-800" aria-label="Loading" /> : <CorrelationGrid matrix={correlation} />}
        </Card>
      </div>
    </section>
  )
}

function StrengthBars({ data }: { data: { currency: string; change: number }[] }) {
  const max = Math.max(0.01, ...data.map((d) => Math.abs(d.change)))
  return (
    <>
      <ul className="flex flex-col gap-2.5" aria-label="Currency strength, strongest first">
        {data.map(({ currency, change }) => {
          const width = (Math.abs(change) / max) * 50
          const positive = change >= 0
          return (
            <li key={currency} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-3" title={`${currencyName(currency)}: ${formatPercent(change)}`}>
              <span className="font-mono text-xs font-semibold text-ink-300">{currency}</span>
              <div className="relative h-5">
                <span className="absolute inset-y-0 left-1/2 w-px bg-ink-600" aria-hidden />
                <span
                  className={positive ? 'absolute inset-y-0.5 rounded-r bg-accent-500' : 'absolute inset-y-0.5 rounded-l bg-rose-400'}
                  style={positive ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
                  aria-hidden
                />
              </div>
              <span className="text-right font-mono text-xs text-ink-100 tabular-nums">{formatPercent(change)}</span>
            </li>
          )
        })}
      </ul>
      <p className="flex items-center gap-4 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-accent-500" aria-hidden /> Strengthened
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-rose-400" aria-hidden /> Weakened
        </span>
      </p>
    </>
  )
}

/** Diverging fill: emerald for positive, rose for negative, intensity = |r|; neutral near 0. */
function cellStyle(r: number) {
  if (!Number.isFinite(r)) return {}
  const alpha = Math.min(1, Math.abs(r)) * 0.75
  const rgb = r >= 0 ? '16 185 129' : '251 113 133'
  return { backgroundColor: `rgb(${rgb} / ${alpha.toFixed(3)})` }
}

function CorrelationGrid({ matrix }: { matrix: number[][] }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[24rem] border-separate border-spacing-0.5 text-center font-mono text-xs tabular-nums">
          <caption className="sr-only">Correlation of daily returns against USD</caption>
          <thead>
            <tr className="text-ink-300">
              <th scope="col">
                <span className="sr-only">Currency</span>
              </th>
              {NON_USD.map((c) => (
                <th key={c} scope="col" className="py-1 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NON_USD.map((row, i) => (
              <tr key={row}>
                <th scope="row" className="pr-2 text-left font-semibold text-ink-300">
                  {row}
                </th>
                {NON_USD.map((col, j) => {
                  const r = matrix[i]![j]!
                  return (
                    <td
                      key={col}
                      className="rounded py-2 text-ink-100"
                      style={cellStyle(r)}
                      title={`${row}/USD vs ${col}/USD: ${Number.isFinite(r) ? r.toFixed(2) : 'n/a'}`}
                    >
                      {Number.isFinite(r) ? r.toFixed(2) : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-400" aria-hidden>
        <span>−1</span>
        <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-rose-400/75 via-transparent to-accent-500/75" />
        <span>+1</span>
      </div>
    </>
  )
}
