import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import type { TransactionResponse, WalletResponse } from '../api/types'
import { SourceBadge } from '../components/SourceBadge'
import { Button, Card, ErrorAlert, Field, Select } from '../components/ui'
import { CURRENCIES, currencyName } from '../lib/currencies'
import { formatAmount, formatMoney, formatRate } from '../lib/format'

function initialCurrency(value: string | null, fallback: string): string {
  return value && (CURRENCIES as readonly string[]).includes(value) ? value : fallback
}

/** Truncate (not round) to 2 decimals, matching the backend's round-down. */
function floor2(value: number): number {
  return Math.floor(value * 100 + 1e-9) / 100
}

export function TradePage() {
  const [searchParams] = useSearchParams()
  const walletQuery = useQuery({ queryKey: queryKeys.wallet, queryFn: api.myWallet, retry: false })

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-ink-400">Trade</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Convert currencies</h1>
      </header>

      {walletQuery.isPending && <div className="h-80 animate-pulse rounded-2xl bg-ink-900" aria-label="Loading wallet" />}

      {walletQuery.isError &&
        (walletQuery.error instanceof ApiError && walletQuery.error.status === 404 ? (
          <Card>
            <p className="text-ink-300">You need a demo wallet before you can trade.</p>
            <Link to="/" className="mt-3 inline-block text-sm font-medium text-accent-300 hover:underline">
              Open your wallet on the dashboard →
            </Link>
          </Card>
        ) : (
          <ErrorAlert>Couldn't load your wallet: {walletQuery.error.message}</ErrorAlert>
        ))}

      {walletQuery.data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <ConvertForm
            wallet={walletQuery.data}
            initialFrom={initialCurrency(searchParams.get('from'), 'USD')}
            initialTo={initialCurrency(searchParams.get('to'), 'EUR')}
          />
          <BalancesCard wallet={walletQuery.data} />
        </div>
      )}
    </div>
  )
}

function ConvertForm({ wallet, initialFrom, initialTo }: { wallet: WalletResponse; initialFrom: string; initialTo: string }) {
  const queryClient = useQueryClient()
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialFrom === initialTo ? (initialFrom === 'USD' ? 'EUR' : 'USD') : initialTo)
  const [amountText, setAmountText] = useState('')
  const [lastTrade, setLastTrade] = useState<TransactionResponse | null>(null)

  const ratesQuery = useQuery({ queryKey: queryKeys.rates(from), queryFn: () => api.rates(from) })
  const rate = ratesQuery.data?.rates[to]

  const available = wallet.holdings.find((h) => h.currency === from)?.amount ?? 0
  const amount = Number(amountText)
  const amountValid = amountText !== '' && Number.isFinite(amount) && amount > 0
  const tooMuch = amountValid && amount > available
  const estimate = amountValid && rate ? floor2(amount * rate) : null

  const convert = useMutation({
    mutationFn: api.convert,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.wallet, result.wallet)
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      setLastTrade(result.transaction)
      setAmountText('')
    },
  })
  const fieldErrors = convert.error instanceof ApiError ? convert.error.fieldErrors : {}

  function swap() {
    setFrom(to)
    setTo(from)
    setLastTrade(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!amountValid || tooMuch) return
    setLastTrade(null)
    convert.mutate({ from, to, amount })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <Select
            label="From"
            value={from}
            onChange={(e) => {
              const next = e.target.value
              if (next === to) setTo(from)
              setFrom(next)
              setLastTrade(null)
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} · {currencyName(c)}
              </option>
            ))}
          </Select>

          <button
            type="button"
            onClick={swap}
            className="mx-auto grid size-10 place-items-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-100"
            aria-label="Swap currencies"
            title="Swap currencies"
          >
            <ArrowDownUp className="size-4 sm:rotate-90" aria-hidden />
          </button>

          <Select
            label="To"
            value={to}
            onChange={(e) => {
              const next = e.target.value
              if (next === from) setFrom(to)
              setTo(next)
              setLastTrade(null)
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} · {currencyName(c)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Field
            label={`Amount (${from})`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amountText}
            onChange={(e) => {
              setAmountText(e.target.value)
              setLastTrade(null)
            }}
            error={tooMuch ? `You only have ${formatAmount(available, from)} ${from}` : fieldErrors.amount}
            hint={`Available: ${formatAmount(available, from)} ${from}`}
          />
          {available > 0 && (
            <button
              type="button"
              onClick={() => setAmountText(floor2(available).toFixed(2))}
              className="mt-1.5 text-xs font-semibold text-accent-300 hover:underline"
            >
              Use max
            </button>
          )}
        </div>

        {/* Quote preview */}
        <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-4">
          {ratesQuery.isError ? (
            <p className="text-sm text-red-300">{ratesQuery.error.message}</p>
          ) : rate === undefined ? (
            <div className="h-12 animate-pulse rounded bg-ink-800" aria-label="Loading quote" />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-ink-400">
                  1 {from} = <span className="font-mono text-ink-100">{formatRate(rate)}</span> {to}
                </span>
                {ratesQuery.data && <SourceBadge source={ratesQuery.data.source} />}
              </div>
              <p className="mt-3 text-sm text-ink-400">You'll receive about</p>
              <p className="font-mono text-2xl font-semibold" aria-live="polite">
                {estimate !== null ? formatMoney(estimate, to) : formatMoney(0, to)}
              </p>
            </>
          )}
        </div>

        {convert.isError && Object.keys(fieldErrors).length === 0 && <ErrorAlert>{convert.error.message}</ErrorAlert>}

        {lastTrade && lastTrade.fromAmount !== null && lastTrade.fromCurrency && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-accent-400/30 bg-accent-500/10 p-3 text-sm text-accent-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-300" aria-hidden />
            <span>
              Converted {formatMoney(lastTrade.fromAmount, lastTrade.fromCurrency)} to{' '}
              <strong>{formatMoney(lastTrade.toAmount, lastTrade.toCurrency)}</strong> at {formatRate(lastTrade.rate ?? 0)}.{' '}
              <Link to="/history" className="font-medium underline">
                View history
              </Link>
            </span>
          </div>
        )}

        <Button type="submit" loading={convert.isPending} disabled={!amountValid || tooMuch || rate === undefined}>
          Convert {from} → {to}
        </Button>
      </form>
    </Card>
  )
}

function BalancesCard({ wallet }: { wallet: WalletResponse }) {
  return (
    <Card className="h-fit">
      <h2 className="text-sm font-semibold text-ink-300">Your balances</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {wallet.holdings.map((h) => (
          <li key={h.currency} className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-sm font-semibold">{h.currency}</span>
            <span className="text-right">
              <span className="block font-mono text-sm tabular-nums">{formatAmount(h.amount, h.currency)}</span>
              {h.currency !== wallet.currency && h.valueInBase !== null && (
                <span className="block text-xs text-ink-400">≈ {formatMoney(h.valueInBase, wallet.currency)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {wallet.totalValue !== null && (
        <div className="mt-4 flex items-baseline justify-between border-t border-ink-800 pt-4">
          <span className="text-sm text-ink-400">Total value</span>
          <span className="font-mono text-sm font-semibold">{formatMoney(wallet.totalValue, wallet.currency)}</span>
        </div>
      )}
    </Card>
  )
}
