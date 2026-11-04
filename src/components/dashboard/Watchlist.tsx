import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Bell, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { api, queryKeys } from '../../api/endpoints'
import type { AlertDirection, CryptoPrice, WalletResponse } from '../../api/types'
import { useCryptoPrices } from '../../hooks/useCryptoPrices'
import { formatPercent, formatUsdPrice } from '../../lib/format'
import { LivePrice, StreamIndicator } from '../LivePrice'
import { Card } from '../ui'
import type { Side } from './QuickTrade'

/** Live crypto prices with a 7-day trend; each row can start a trade or set an alert in place. */
export function Watchlist({ wallet, onTrade }: { wallet: WalletResponse; onTrade: (code: string, side: Side) => void }) {
  const prices = useCryptoPrices()
  const [alertFor, setAlertFor] = useState<string | null>(null)

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
        <h2 className="font-semibold">Watchlist</h2>
        <StreamIndicator status={prices.stream} />
      </div>
      {!prices.data ? (
        <div className="m-5 h-64 animate-pulse rounded-lg bg-ink-800/60" aria-label="Loading prices" />
      ) : (
        <ul className="divide-y divide-ink-800/80">
          {prices.data.prices.map((p) => {
            const held = (wallet.holdings.find((h) => h.currency === p.symbol)?.amount ?? 0) > 0
            return (
              <li key={p.symbol} className="group">
                <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-800/40">
                  <div className="w-20 shrink-0">
                    <p className="font-mono text-sm font-semibold">{p.symbol}</p>
                    <p className="truncate text-xs text-ink-400">{p.name}</p>
                  </div>
                  <Sparkline symbol={p.symbol} />
                  <div className="ml-auto text-right">
                    <LivePrice price={p.priceUsd} className="text-sm" />
                    <p className={clsx('font-mono text-xs', p.change24h >= 0 ? 'text-accent-300' : 'text-rose-300')}>{formatPercent(p.change24h)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <RowButton onClick={() => onTrade(p.symbol, 'buy')} label={`Buy ${p.symbol}`} tone="buy">
                      Buy
                    </RowButton>
                    <RowButton onClick={() => onTrade(p.symbol, 'sell')} label={`Sell ${p.symbol}`} disabled={!held}>
                      Sell
                    </RowButton>
                    <button
                      type="button"
                      onClick={() => setAlertFor(alertFor === p.symbol ? null : p.symbol)}
                      aria-expanded={alertFor === p.symbol}
                      aria-label={`Set a price alert on ${p.symbol}`}
                      title="Set a price alert"
                      className={clsx(
                        'grid size-7 place-items-center rounded-md transition-colors',
                        alertFor === p.symbol ? 'bg-accent-500/15 text-accent-300' : 'text-ink-400 hover:bg-ink-700 hover:text-ink-100',
                      )}
                    >
                      <Bell className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
                {alertFor === p.symbol && <QuickAlert price={p} onClose={() => setAlertFor(null)} />}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function RowButton({ children, onClick, label, tone, disabled }: {
  children: string
  onClick: () => void
  label: string
  tone?: 'buy'
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      title={disabled ? `You don't hold any ${label.split(' ')[1]}` : label}
      className={clsx(
        'h-7 rounded-md px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35',
        tone === 'buy' ? 'bg-accent-500/15 text-accent-300 hover:bg-accent-500/25' : 'bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-ink-100',
      )}
    >
      {children}
    </button>
  )
}

const PRESETS: { direction: AlertDirection; pct: number }[] = [
  { direction: 'BELOW', pct: -5 },
  { direction: 'BELOW', pct: -2 },
  { direction: 'ABOVE', pct: 2 },
  { direction: 'ABOVE', pct: 5 },
]

/** One-tap alert: ±2% or ±5% from the live price. */
function QuickAlert({ price, onClose }: { price: CryptoPrice; onClose: () => void }) {
  const queryClient = useQueryClient()
  const create = useMutation({
    mutationFn: api.createAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  })
  const targetFor = (pct: number) => {
    const raw = price.priceUsd * (1 + pct / 100)
    return Number(raw.toFixed(raw >= 10 ? 2 : 4))
  }

  return (
    <div className="flex animate-fade-up flex-wrap items-center gap-2 bg-ink-950/50 px-5 py-3 text-xs">
      {create.isSuccess ? (
        <p role="status" className="flex flex-1 items-center gap-1.5 text-accent-300">
          <Check className="size-3.5" aria-hidden />
          Alert set: {price.symbol} {create.variables.direction === 'ABOVE' ? 'above' : 'below'} {formatUsdPrice(create.variables.targetRate)}.{' '}
          <Link to="/orders" className="underline">
            Manage
          </Link>
        </p>
      ) : (
        <>
          <span className="text-ink-400">Alert me when {price.symbol} moves</span>
          {PRESETS.map(({ direction, pct }) => (
            <button
              key={pct}
              type="button"
              disabled={create.isPending}
              onClick={() => create.mutate({ base: price.symbol, quote: 'USD', direction, targetRate: targetFor(pct) })}
              title={`${direction === 'ABOVE' ? 'Above' : 'Below'} ${formatUsdPrice(targetFor(pct))}`}
              className={clsx(
                'rounded-md border px-2 py-1 font-mono font-semibold transition-colors disabled:opacity-50',
                pct > 0 ? 'border-accent-500/30 text-accent-300 hover:bg-accent-500/15' : 'border-rose-400/30 text-rose-300 hover:bg-rose-500/15',
              )}
            >
              {pct > 0 ? '+' : '−'}
              {Math.abs(pct)}%
            </button>
          ))}
          {create.isError && <span className="text-red-300">{create.error.message}</span>}
        </>
      )}
      <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-100">
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

/** 7-day daily-close trend line: one 2px stroke, rose when the week is down. */
function Sparkline({ symbol }: { symbol: string }) {
  const history = useQuery({
    queryKey: queryKeys.cryptoHistory(symbol, 7),
    queryFn: () => api.cryptoHistory(symbol, 7),
    staleTime: 10 * 60 * 1000,
  })
  const points = history.data?.points ?? []
  const W = 72
  const H = 28
  if (points.length < 2) return <span className="hidden h-7 w-[72px] sm:block" aria-hidden />

  const rates = points.map((p) => p.rate)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const span = max - min || 1
  const coords = rates.map((r, i) => [(i / (rates.length - 1)) * (W - 4) + 2, H - 3 - ((r - min) / span) * (H - 6)] as const)
  const change = ((rates[rates.length - 1]! - rates[0]!) / rates[0]!) * 100
  const up = change >= 0

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`${symbol} 7-day trend: ${formatPercent(change)}`}
      className={clsx('hidden shrink-0 sm:block', up ? 'text-accent-400' : 'text-rose-400')}
    >
      <polyline points={coords.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1]![0]} cy={coords[coords.length - 1]![1]} r={2.5} fill="currentColor" />
    </svg>
  )
}
