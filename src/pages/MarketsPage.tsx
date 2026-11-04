import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, queryKeys } from '../api/endpoints'
import { CryptoMarkets } from '../components/CryptoMarkets'
import { RateChart } from '../components/RateChart'
import { SourceBadge } from '../components/SourceBadge'
import { Card, ErrorAlert, Segmented, Select } from '../components/ui'
import { CURRENCIES, currencyName } from '../lib/currencies'
import { formatPercent, formatRate } from '../lib/format'

const RANGES = [
  { value: 30, label: '1M' },
  { value: 90, label: '3M' },
  { value: 180, label: '6M' },
  { value: 365, label: '1Y' },
]

type View = 'forex' | 'crypto'

export function MarketsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: View = searchParams.get('view') === 'crypto' ? 'crypto' : 'forex'

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-ink-400">Markets</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{view === 'crypto' ? 'Crypto prices' : 'Exchange rates'}</h1>
        </div>
        <Segmented
          label="Market"
          options={[
            { value: 'forex', label: 'Forex' },
            { value: 'crypto', label: 'Crypto' },
          ]}
          value={view}
          onChange={(next) => setSearchParams(next === 'crypto' ? { view: 'crypto' } : {}, { replace: true })}
        />
      </header>

      {view === 'crypto' ? <CryptoMarkets /> : <ForexMarkets />}
    </div>
  )
}

function ForexMarkets() {
  const [base, setBase] = useState<string>('EUR')
  const [quote, setQuote] = useState<string>('USD')
  const [days, setDays] = useState(30)

  const ratesQuery = useQuery({ queryKey: queryKeys.rates(base), queryFn: () => api.rates(base) })

  function changeBase(next: string) {
    setBase(next)
    if (next === quote) setQuote(next === 'USD' ? 'EUR' : 'USD')
  }

  return (
    <div className="flex flex-col gap-8">
      {ratesQuery.data && (
        <div className="flex justify-end">
          <SourceBadge source={ratesQuery.data.source} date={ratesQuery.data.date} />
        </div>
      )}

      <PairChart base={base} quote={quote} days={days} onDaysChange={setDays} />

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-6 py-4">
          <h2 className="font-semibold">
            1 {base} <span className="font-normal text-ink-400">in other currencies</span>
          </h2>
          <Select label="Base currency" hideLabel value={base} onChange={(e) => changeBase(e.target.value)} className="w-28">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        {ratesQuery.isPending && <div className="m-6 h-64 animate-pulse rounded-lg bg-ink-800" aria-label="Loading rates" />}
        {ratesQuery.isError && (
          <div className="p-6">
            <ErrorAlert>{ratesQuery.error.message}</ErrorAlert>
          </div>
        )}
        {ratesQuery.data && (
          <ul className="divide-y divide-ink-800">
            {Object.entries(ratesQuery.data.rates).map(([code, rate]) => {
              const selected = code === quote
              return (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => setQuote(code)}
                    aria-pressed={selected}
                    className={clsx(
                      'flex w-full items-center gap-4 px-6 py-3 text-left transition-colors',
                      selected ? 'bg-ink-800' : 'hover:bg-ink-800/50',
                    )}
                  >
                    <span className="w-24 shrink-0 font-mono text-sm font-semibold">
                      {base}/{code}
                    </span>
                    <span className="hidden flex-1 truncate text-sm text-ink-400 sm:block">{currencyName(code)}</span>
                    <span className="ml-auto font-mono text-sm tabular-nums">{formatRate(rate)}</span>
                    <ChevronRight
                      className={clsx('size-4 shrink-0', selected ? 'text-accent-300' : 'text-ink-600')}
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function PairChart({
  base,
  quote,
  days,
  onDaysChange,
}: {
  base: string
  quote: string
  days: number
  onDaysChange: (days: number) => void
}) {
  const historyQuery = useQuery({
    queryKey: queryKeys.history(base, quote, days),
    queryFn: () => api.rateHistory(base, quote, days),
    placeholderData: (previous) => previous, // keep the old chart while the new range loads
  })

  const points = historyQuery.data?.points ?? []
  const first = points[0]
  const last = points[points.length - 1]
  const change = first && last ? ((last.rate - first.rate) / first.rate) * 100 : null
  const pair = `${base}/${quote}`

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm text-ink-400">
            {pair} · {currencyName(base)} to {currencyName(quote)}
          </h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <p className="font-mono text-3xl font-semibold tracking-tight">{last ? formatRate(last.rate) : '—'}</p>
            {change !== null && (
              <span
                className={clsx(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
                  change >= 0 ? 'bg-accent-500/15 text-accent-300' : 'bg-red-500/15 text-red-300',
                )}
              >
                {change >= 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
                {formatPercent(change)}
                <span className="sr-only">over the selected range</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Segmented label="Chart range" options={RANGES} value={days} onChange={onDaysChange} />
          <Link
            to={`/trade?from=${base}&to=${quote}`}
            className="hidden h-9 items-center rounded-lg bg-accent-500 px-3 text-xs font-semibold text-ink-950 hover:bg-accent-400 sm:inline-flex"
          >
            Trade {pair}
          </Link>
        </div>
      </div>

      {historyQuery.isError ? (
        <ErrorAlert>{historyQuery.error.message}</ErrorAlert>
      ) : points.length >= 2 ? (
        <div className={clsx('transition-opacity', historyQuery.isPlaceholderData && 'opacity-50')}>
          <RateChart points={points} pair={pair} />
        </div>
      ) : (
        <div className="h-[260px] animate-pulse rounded-lg bg-ink-800" aria-label="Loading chart" />
      )}
    </Card>
  )
}
