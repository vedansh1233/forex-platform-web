import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import { TransactionAmounts, TransactionIcon } from '../components/TransactionSummary'
import { transactionTitle } from '../lib/transactions'
import { Button, Card, ErrorAlert } from '../components/ui'
import { formatDateTime, formatRate } from '../lib/format'

const PAGE_SIZE = 10

export function HistoryPage() {
  const [page, setPage] = useState(0)

  const query = useQuery({
    queryKey: queryKeys.transactionsPage(page, PAGE_SIZE),
    queryFn: () => api.transactions(page, PAGE_SIZE),
    placeholderData: (previous) => previous,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  })

  const data = query.data

  return (
    <div className="stagger flex flex-col gap-8">
      <header>
        <p className="eyebrow">History</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Transactions</h1>
      </header>

      {query.isPending && <div className="h-80 animate-pulse rounded-2xl bg-ink-900" aria-label="Loading transactions" />}

      {query.isError &&
        (query.error instanceof ApiError && query.error.status === 404 ? (
          <Card>
            <p className="text-ink-300">No wallet yet, so there's no history.</p>
            <Link to="/" className="mt-3 inline-block text-sm font-medium text-accent-300 hover:underline">
              Open your wallet on the dashboard →
            </Link>
          </Card>
        ) : (
          <ErrorAlert>{query.error.message}</ErrorAlert>
        ))}

      {data && (
        <Card className={clsx('p-0 transition-opacity', query.isPlaceholderData && 'opacity-60')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-ink-800 text-xs tracking-wide text-ink-400 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Transaction</th>
                  <th scope="col" className="px-6 py-3 font-medium">Amount</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">Rate</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {data.items.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <TransactionIcon tx={tx} />
                        <span className="font-medium">{transactionTitle(tx)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <TransactionAmounts tx={tx} />
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-ink-300">
                      {tx.rate !== null ? formatRate(tx.rate) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap text-ink-400">{formatDateTime(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-ink-800 px-6 py-3">
            <p className="text-sm text-ink-400">
              {data.totalItems} transaction{data.totalItems === 1 ? '' : 's'}
              {data.totalPages > 1 && ` · page ${data.page + 1} of ${data.totalPages}`}
            </p>
            {data.totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="h-9 px-3"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="secondary"
                  className="h-9 px-3"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= data.totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
