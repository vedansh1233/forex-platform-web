import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { ArrowLeftRight, CandlestickChart, Radio, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import type { WalletResponse } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { TransactionAmounts, TransactionIcon } from '../components/TransactionSummary'
import { Button, Card, ErrorAlert } from '../components/ui'
import { currencyName } from '../lib/currencies'
import { formatAmount, formatDate, formatDateTime, formatLongDay, formatMoney } from '../lib/format'
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
  })

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-ink-400">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {firstName}</h1>
      </header>

      <WalletSection query={walletQuery} />

      {walletQuery.data && <RecentActivity />}

      <section aria-labelledby="roadmap-heading">
        <h2 id="roadmap-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-400 uppercase">
          Coming next
        </h2>
        <div className="flex gap-3 rounded-xl border border-dashed border-ink-700 p-4">
          <Radio className="mt-0.5 size-5 shrink-0 text-ink-400" aria-hidden />
          <div>
            <h3 className="text-sm font-medium">Real-time ticker</h3>
            <p className="mt-0.5 text-sm text-ink-400">Streaming price updates over WebSocket.</p>
          </div>
        </div>
      </section>
    </div>
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
            {wallet.totalValue === null && foreign.length > 0 ? '—' : formatMoney(total, wallet.currency)}
          </p>
          <p className="mt-2 text-sm text-ink-400">
            {wallet.valuationDate ? `Valued at rates from ${formatLongDay(wallet.valuationDate)}` : `Opened ${formatDate(wallet.createdAt)}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/trade"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent-500 px-4 text-sm font-semibold text-ink-950 hover:bg-accent-400"
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

      <ul className="mt-6 grid gap-3 border-t border-ink-800 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {wallet.holdings.map((h) => (
          <li key={h.currency} className="rounded-xl bg-ink-800/60 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span className="font-mono font-semibold text-ink-300">{h.currency}</span>
              <span className="truncate pl-2">{currencyName(h.currency)}</span>
            </div>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatAmount(h.amount, h.currency)}</p>
            {h.currency !== wallet.currency && (
              <p className="text-xs text-ink-400">
                {h.valueInBase !== null ? `≈ ${formatMoney(h.valueInBase, wallet.currency)}` : 'Value unavailable'}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
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
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{transactionTitle(tx)}</p>
                <p className="text-xs text-ink-400">{formatDateTime(tx.createdAt)}</p>
              </div>
              <TransactionAmounts tx={tx} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
