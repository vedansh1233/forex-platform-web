import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { ArrowLeftRight, ArrowUpRight, CandlestickChart, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { ActiveOrders } from '../components/dashboard/ActiveOrders'
import { QuickTrade, type Side } from '../components/dashboard/QuickTrade'
import { Watchlist } from '../components/dashboard/Watchlist'
import { api, queryKeys } from '../api/endpoints'
import type { WalletResponse } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { LivePrice, StreamIndicator } from '../components/LivePrice'
import { CountUp } from '../components/CountUp'
import { TransactionAmounts, TransactionIcon } from '../components/TransactionSummary'
import { Button, Card, ErrorAlert, Highlight } from '../components/ui'
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { currencyName } from '../lib/currencies'
import { formatAmount, formatDate, formatDateTime, formatLongDay, formatMoney, formatPercent } from '../lib/format'
import { transactionTitle } from '../lib/transactions'

const RECENT_COUNT = 5

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.fullName.split(' ')[0] ?? 'trader'

  const walletQuery = useQuery({
    queryKey: queryKeys.wallet,
    queryFn: api.myWallet,
    // 404 just means "no wallet yet", so don't retry it
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
    // Crypto holdings are valued at live prices, so keep the total moving
    refetchInterval: (query) => (query.state.data ? 20_000 : false),
  })

  return (
    <div className="stagger flex flex-col gap-8">
      <header>
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, <Highlight>{firstName}</Highlight>
        </h1>
      </header>

      <CryptoTicker />

      <WalletSection query={walletQuery} />

      {walletQuery.data && <TradingDesk wallet={walletQuery.data} />}

      {walletQuery.data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ActiveOrders />
          <RecentActivity />
        </div>
      )}
    </div>
  )
}

/** Quick trade beside the watchlist; a watchlist Buy/Sell preselects the trade and jumps to it. */
function TradingDesk({ wallet }: { wallet: WalletResponse }) {
  const [asset, setAsset] = useState('BTC')
  const [side, setSide] = useState<Side>('buy')

  function trade(code: string, nextSide: Side) {
    setAsset(code)
    setSide(nextSide)
    const form = document.getElementById('quick-trade')
    form?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Wait for the remount (key below) before focusing the new amount field
    requestAnimationFrame(() => document.getElementById('quick-amount')?.focus({ preventScroll: true }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <QuickTrade key={`${asset}-${side}`} wallet={wallet} asset={asset} side={side} onAssetChange={setAsset} onSideChange={setSide} />
      <Watchlist wallet={wallet} onTrade={trade} />
    </div>
  )
}

/** Live crypto prices, streamed over WebSocket. */
function CryptoTicker() {
  const prices = useCryptoPrices()
  if (!prices.data) return <div className="h-[74px] animate-pulse rounded-2xl bg-ink-900" aria-label="Loading prices" />

  return (
    <section aria-label="Live crypto prices" className="rounded-2xl border border-ink-700 bg-ink-900/80 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <StreamIndicator status={prices.stream} />
        <Link to="/markets?view=crypto" className="group inline-flex items-center gap-1 text-xs font-medium text-accent-300">
          Crypto markets
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </Link>
      </div>
      {/* Four copies of the list scroll as a loop (the track moves by half its width); only the first is read out. */}
      <div className="marquee">
        <div className="marquee-track">
          {[0, 1, 2, 3].map((copy) => (
            <ul key={copy} className="flex shrink-0" aria-hidden={copy > 0 || undefined}>
              {prices.data.prices.map((p) => (
                <li key={p.symbol} className="flex shrink-0 items-baseline gap-2 border-r border-ink-700/70 px-5">
                  <span className="font-mono text-xs font-semibold text-ink-300">{p.symbol}</span>
                  <LivePrice price={p.priceUsd} className="text-sm" />
                  <span className={p.change24h >= 0 ? 'font-mono text-xs text-accent-300' : 'font-mono text-xs text-rose-300'}>
                    {formatPercent(p.change24h)}
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {prices.data.source === 'SIMULATED' && <p className="mt-1 text-xs text-amber-200">Simulated prices: the live crypto feed is unavailable.</p>}
    </section>
  )
}

function WalletSection({ query }: { query: UseQueryResult<WalletResponse, Error> }) {
  const queryClient = useQueryClient()
  const createWallet = useMutation({
    mutationFn: api.createWallet,
    onSuccess: (wallet) => {
      queryClient.setQueryData(queryKeys.wallet, wallet)
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    },
  })

  if (query.isPending) {
    return (
      <Card>
        <div className="h-40 animate-pulse rounded-lg bg-ink-800" aria-label="Loading wallet" />
      </Card>
    )
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-xl bg-accent-500/15 text-accent-300">
            <Wallet className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">Open your demo wallet</h2>
            <p className="text-sm text-ink-400">Get $10,000 in virtual USD to start trading.</p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button onClick={() => createWallet.mutate()} loading={createWallet.isPending}>
            Create wallet
          </Button>
          {createWallet.error && <p className="text-xs text-red-300">{createWallet.error.message}</p>}
        </div>
      </Card>
    )
  }

  if (query.isError) {
    return <ErrorAlert>Couldn't load your wallet: {query.error.message}</ErrorAlert>
  }

  const wallet = query.data
  const total = wallet.totalValue ?? wallet.balance
  const foreign = wallet.holdings.filter((h) => h.currency !== wallet.currency)
  const parts = allocationOf(wallet)
  const partByCode = new Map(parts?.map((p) => [p.key, p]))

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent-500/10 blur-3xl" aria-hidden />

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Wallet className="size-4" aria-hidden />
            Demo wallet · total value in {wallet.currency}
          </div>
          <p className="mt-3 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
            {wallet.totalValue === null && foreign.length > 0 ? (
              '—'
            ) : (
              <CountUp value={total} format={(n) => formatMoney(n, wallet.currency)} />
            )}
          </p>
          <p className="mt-2 text-sm text-ink-400">
            {wallet.valuationDate ? `Valued at rates from ${formatLongDay(wallet.valuationDate)}` : `Opened ${formatDate(wallet.createdAt)}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/trade"
            className="btn-glow inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-ink-950"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
            Trade
          </Link>
          <Link
            to="/markets"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink-700 px-4 text-sm font-semibold hover:bg-ink-600"
          >
            <CandlestickChart className="size-4" aria-hidden />
            Markets
          </Link>
        </div>
      </div>

      {parts && parts.length > 1 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-ink-400">Allocation</p>
          <div
            role="img"
            aria-label={`Allocation: ${parts.map((p) => `${p.label} ${formatShare(p.share)}`).join(', ')}`}
            className="flex h-2 origin-left animate-[grow-x_1.1s_cubic-bezier(0.22,1,0.36,1)_both] gap-0.5 overflow-hidden rounded-full"
          >
            {parts.map((p) => (
              <span
                key={p.key}
                title={`${p.label}: ${formatShare(p.share)}`}
                className="h-full transition-[flex-grow] duration-700"
                style={{ flexGrow: p.share, flexBasis: 0, backgroundColor: p.color }}
              />
            ))}
          </div>
        </div>
      )}

      <ul className="mt-6 grid gap-3 border-t border-ink-800 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {wallet.holdings.map((h) => {
          const part = partByCode.get(h.currency)
          return (
          <li key={h.currency} className="rounded-xl border border-transparent bg-ink-800/60 px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-accent-500/30 hover:bg-ink-800">
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <span className="flex shrink-0 items-center gap-1.5 font-mono font-semibold text-ink-300">
                {part && <span className="size-2 rounded-full" style={{ backgroundColor: part.color }} aria-hidden />}
                {h.currency}
              </span>
              <span className="min-w-0 flex-1 truncate">{currencyName(h.currency)}</span>
              {part && parts && parts.length > 1 && <span className="shrink-0 font-mono text-ink-300">{formatShare(part.share)}</span>}
            </div>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatAmount(h.amount, h.currency)}</p>
            {h.currency !== wallet.currency && (
              <p className="text-xs text-ink-400">
                {h.valueInBase !== null ? `≈ ${formatMoney(h.valueInBase, wallet.currency)}` : 'Value unavailable'}
              </p>
            )}
          </li>
          )
        })}
      </ul>
    </Card>
  )
}

/**
 * Categorical slots 1–5 of the dataviz palette, stepped for a dark surface (validated against
 * ink-900: CVD ΔE ≥ 8.4, contrast ≥ 3:1), plus a neutral for "Other".
 */
const ALLOCATION_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181']
const OTHER_COLOR = '#7d8aa3'

interface AllocationPart {
  key: string
  label: string
  share: number
  color: string
}

/**
 * Each holding's share of the total, in the wallet's order (USD, currencies, crypto) so a
 * holding keeps its color. Past five, the smallest fold into "Other". Null if any value is unknown.
 */
function allocationOf(wallet: WalletResponse): AllocationPart[] | null {
  const values = wallet.holdings.map((h) => ({ code: h.currency, value: h.currency === wallet.currency ? h.amount : h.valueInBase }))
  if (values.some((v) => v.value === null)) return null
  const total = values.reduce((sum, v) => sum + (v.value ?? 0), 0)
  if (total <= 0) return null

  const kept = new Set(
    [...values].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, values.length > 6 ? 5 : 6).map((v) => v.code),
  )
  const parts: AllocationPart[] = values
    .filter((v) => kept.has(v.code) && (v.value ?? 0) > 0)
    .map((v, i) => ({ key: v.code, label: v.code, share: (v.value ?? 0) / total, color: ALLOCATION_COLORS[i] ?? OTHER_COLOR }))
  const otherShare = values.filter((v) => !kept.has(v.code)).reduce((sum, v) => sum + (v.value ?? 0), 0) / total
  if (otherShare > 0) parts.push({ key: 'other', label: 'Other', share: otherShare, color: OTHER_COLOR })
  return parts
}

function formatShare(share: number) {
  return share >= 0.995 ? '100%' : share < 0.001 ? '<0.1%' : `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`
}

function RecentActivity() {
  const query = useQuery({
    queryKey: queryKeys.transactionsPage(0, RECENT_COUNT),
    queryFn: () => api.transactions(0, RECENT_COUNT),
  })

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
        <h2 className="font-semibold">Recent activity</h2>
        <Link to="/history" className="text-sm font-medium text-accent-300 hover:underline">
          View all
        </Link>
      </div>
      {query.isPending && <div className="m-6 h-24 animate-pulse rounded-lg bg-ink-800" />}
      {query.isError && (
        <div className="p-6">
          <ErrorAlert>{query.error.message}</ErrorAlert>
        </div>
      )}
      {query.data && (
        <ul className="divide-y divide-ink-800">
          {query.data.items.map((tx) => (
            <li key={tx.id} className="flex flex-wrap items-center gap-3 px-6 py-3">
              <TransactionIcon tx={tx} />
              {/* In a narrow column the amounts drop below the title instead of squeezing it */}
              <div className="min-w-[8.5rem] flex-1">
                <p className="text-sm font-medium whitespace-nowrap">{transactionTitle(tx)}</p>
                <p className="text-xs whitespace-nowrap text-ink-400">{formatDateTime(tx.createdAt)}</p>
              </div>
              <div className="ml-auto text-right">
                <TransactionAmounts tx={tx} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
