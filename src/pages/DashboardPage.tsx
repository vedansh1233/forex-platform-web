import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, CandlestickChart, History, Radio, Wallet } from 'lucide-react'
import { ApiError } from '../api/client'
import { api } from '../api/endpoints'
import { useAuth } from '../auth/useAuth'
import { Button, Card, ErrorAlert } from '../components/ui'
import { formatDate, formatMoney } from '../lib/format'

const WALLET_QUERY_KEY = ['wallet'] as const

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.fullName.split(' ')[0] ?? 'trader'

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-ink-400">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {firstName}</h1>
      </header>

      <WalletCard />

      <section aria-labelledby="roadmap-heading">
        <h2 id="roadmap-heading" className="mb-3 text-sm font-semibold tracking-wide text-ink-400 uppercase">
          Coming next
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <RoadmapItem icon={CandlestickChart} title="Live rates & charts" text="Major currency pairs with historical charts." />
          <RoadmapItem icon={ArrowLeftRight} title="Convert & trade" text="Exchange your demo balance between currencies." />
          <RoadmapItem icon={History} title="Transaction history" text="Every trade and conversion, searchable." />
          <RoadmapItem icon={Radio} title="Real-time ticker" text="Streaming price updates over WebSocket." />
        </div>
      </section>
    </div>
  )
}

function WalletCard() {
  const queryClient = useQueryClient()

  const walletQuery = useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: api.myWallet,
    // 404 just means "no wallet yet", so don't retry it
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })

  const createWallet = useMutation({
    mutationFn: api.createWallet,
    onSuccess: (wallet) => queryClient.setQueryData(WALLET_QUERY_KEY, wallet),
  })

  if (walletQuery.isPending) {
    return (
      <Card>
        <div className="h-28 animate-pulse rounded-lg bg-ink-800" aria-label="Loading wallet" />
      </Card>
    )
  }

  const noWallet = walletQuery.error instanceof ApiError && walletQuery.error.status === 404

  if (noWallet) {
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

  if (walletQuery.isError) {
    return <ErrorAlert>Couldn't load your wallet: {walletQuery.error.message}</ErrorAlert>
  }

  const wallet = walletQuery.data
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent-500/10 blur-3xl" aria-hidden />
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <Wallet className="size-4" aria-hidden />
        Demo wallet · {wallet.currency}
      </div>
      <p className="mt-3 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
        {formatMoney(wallet.balance, wallet.currency)}
      </p>
      <p className="mt-2 text-sm text-ink-400">Available balance · opened {formatDate(wallet.createdAt)}</p>
    </Card>
  )
}

function RoadmapItem({ icon: Icon, title, text }: { icon: typeof Wallet; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-ink-700 p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-ink-400" aria-hidden />
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-400">{text}</p>
      </div>
    </div>
  )
}
