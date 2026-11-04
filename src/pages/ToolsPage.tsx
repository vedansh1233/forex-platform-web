import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import { SourceBadge } from '../components/SourceBadge'
import { Calculators } from '../components/tools/Calculators'
import { CrossRates } from '../components/tools/CrossRates'
import { MarketSessions } from '../components/tools/MarketSessions'
import { StrengthCorrelation } from '../components/tools/StrengthCorrelation'
import { ErrorAlert } from '../components/ui'
import { withUsd } from '../lib/fx'

export function ToolsPage() {
  const ratesQuery = useQuery({ queryKey: queryKeys.rates('USD'), queryFn: () => api.rates('USD') })
  const walletQuery = useQuery({
    queryKey: queryKeys.wallet,
    queryFn: api.myWallet,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })

  const usd = ratesQuery.data ? withUsd(ratesQuery.data.rates) : null

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-ink-400">Tools</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Forex toolkit</h1>
        </div>
        {ratesQuery.data && <SourceBadge source={ratesQuery.data.source} date={ratesQuery.data.date} />}
      </header>

      {ratesQuery.isError && <ErrorAlert>Couldn't load rates: {ratesQuery.error.message}</ErrorAlert>}
      {ratesQuery.isPending && <div className="h-80 animate-pulse rounded-2xl bg-ink-900" aria-label="Loading rates" />}

      {usd && (
        <>
          <Calculators usd={usd} defaultBalance={walletQuery.data?.totalValue ?? 10_000} />
          <CrossRates usd={usd} />
        </>
      )}

      <StrengthCorrelation />
      <MarketSessions />
    </div>
  )
}
