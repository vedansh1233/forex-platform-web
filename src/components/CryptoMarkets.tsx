import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight, BellPlus, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { api, queryKeys } from '../api/endpoints'
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { formatPercent } from '../lib/format'
import { LivePrice, StreamIndicator } from './LivePrice'
import { RateChart } from './RateChart'
import { SourceBadge } from './SourceBadge'
import { Card, ErrorAlert, Segmented } from './ui'

const RANGES = [
  { value: 30, label: '1M' },
  { value: 90, label: '3M' },
  { value: 180, label: '6M' },
  { value: 365, label: '1Y' },
]

/** Crypto tab of the Markets page: live prices over WebSocket plus a daily price chart. */
export function CryptoMarkets() {
  const [symbol, setSymbol] = useState('BTC')
  const [days, setDays] = useState(90)
  const prices = useCryptoPrices()
  const selected = prices.data?.prices.find((p) => p.symbol === symbol)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StreamIndicator status={prices.stream} />
        {prices.data && <SourceBadge source={prices.data.source} />}
      </div>

      <CryptoChart symbol={symbol} name={selected?.name ?? symbol} livePrice={selected?.priceUsd} days={days} onDaysChange={setDays} />

      <Card className="p-0">
        <div className="border-b border-ink-800 px-6 py-4">
          <h2 className="font-semibold">
            Crypto <span className="font-normal text-ink-400">in US dollars · 24h change</span>
          </h2>
        </div>
        {prices.isPending && <div className="m-6 h-48 animate-pulse rounded-lg bg-ink-800" aria-label="Loading prices" />}
        {prices.isError && (
          <div className="p-6">
            <ErrorAlert>{prices.error.message}</ErrorAlert>
          </div>
        )}
        {prices.data && (
          <ul className="divide-y divide-ink-800">
            {prices.data.prices.map((p) => {
              const active = p.symbol === symbol
              const up = p.change24h >= 0
              return (
                <li key={p.symbol} className={clsx('flex items-center gap-2 pr-4 transition-colors', active ? 'bg-ink-800' : 'hover:bg-ink-800/50')}>
                  <button
                    type="button"
                    onClick={() => setSymbol(p.symbol)}
                    aria-pressed={active}
                    className="flex min-w-0 flex-1 items-center gap-4 px-6 py-3 text-left"
                  >
                    <span className="w-12 shrink-0 font-mono text-sm font-semibold">{p.symbol}</span>
                    <span className="hidden flex-1 truncate text-sm text-ink-400 sm:block">{p.name}</span>
                    <LivePrice price={p.priceUsd} className="ml-auto text-sm" />
                    <span className={clsx('w-16 text-right font-mono text-xs tabular-nums', up ? 'text-accent-300' : 'text-rose-300')}>
                      {formatPercent(p.change24h)}
                    </span>
                    <ChevronRight className={clsx('size-4 shrink-0', active ? 'text-accent-300' : 'text-ink-600')} aria-hidden />
                  </button>
                  <Link
                    to={`/orders?alert=${p.symbol}`}
                    className="rounded-md p-1.5 text-ink-400 hover:bg-ink-700 hover:text-ink-100"
                    aria-label={`Set a price alert for ${p.name}`}
                    title="Set a price alert"
                  >
                    <BellPlus className="size-4" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function CryptoChart({
  symbol,
  name,
  livePrice,
  days,
  onDaysChange,
}: {
  symbol: string
  name: string
  livePrice: number | undefined
  days: number
  onDaysChange: (days: number) => void
}) {
  const history = useQuery({
    queryKey: queryKeys.cryptoHistory(symbol, days),
    queryFn: () => api.cryptoHistory(symbol, days),
    placeholderData: (previous) => (previous?.base === symbol ? previous : undefined),
  })
  const points = history.data?.points ?? []
  const first = points[0]
  const current = livePrice ?? points[points.length - 1]?.rate
  const change = first && current !== undefined ? ((current - first.rate) / first.rate) * 100 : null
  const pair = `${symbol}/USD`

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm text-ink-400">
            {pair} · {name} in US dollars
          </h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <p className="text-3xl font-semibold tracking-tight">{current !== undefined ? <LivePrice price={current} /> : '—'}</p>
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
            to={`/trade?from=USD&to=${symbol}`}
            className="hidden h-9 items-center rounded-lg bg-accent-500 px-3 text-xs font-semibold text-ink-950 hover:bg-accent-400 sm:inline-flex"
          >
            Buy {symbol}
          </Link>
        </div>
      </div>

      {history.isError ? (
        <ErrorAlert>{history.error.message}</ErrorAlert>
      ) : points.length >= 2 ? (
        <div className={clsx('transition-opacity', history.isPlaceholderData && 'opacity-50')}>
          <RateChart points={points} pair={pair} />
        </div>
      ) : (
        <div className="h-[260px] animate-pulse rounded-lg bg-ink-800" aria-label="Loading chart" />
      )}
      {history.data && <p className="mt-3 text-xs text-ink-400">Daily closing prices (UTC). Source: {history.data.source === 'COINBASE' ? 'Coinbase' : 'simulated'}.</p>}
    </Card>
  )
}
