import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import type { OrderResponse, TransactionResponse, WalletResponse } from '../api/types'
import { AssetSelect } from '../components/AssetSelect'
import { OrderList } from '../components/OrderList'
import { SourceBadge } from '../components/SourceBadge'
import { Button, Card, ErrorAlert, Field, Highlight, Segmented } from '../components/ui'
import { useOrders } from '../hooks/useOrders'
import { usePairSource } from '../hooks/usePairSource'
import { decimalsOf, floorTo, isAsset, isCrypto } from '../lib/currencies'
import { formatAmount, formatMoney, formatRate } from '../lib/format'

type Mode = 'market' | 'limit'

function initialAsset(value: string | null, fallback: string): string {
  return isAsset(value) ? value : fallback
}

/** Number of decimal places typed, e.g. "1.250" -> 3. */
function decimalsIn(text: string): number {
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

/** A rate as plain text for an input: enough significant digits, no thousands separators. */
function rateInput(rate: number): string {
  return rate >= 1 ? rate.toFixed(rate >= 100 ? 2 : 5) : rate.toPrecision(6)
}

export function TradePage() {
  const [searchParams] = useSearchParams()
  const walletQuery = useQuery({ queryKey: queryKeys.wallet, queryFn: api.myWallet, retry: false })

  return (
    <div className="stagger flex flex-col gap-8">
      <header>
        <p className="eyebrow">Trade</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Trade <Highlight>currencies</Highlight> and crypto
        </h1>
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
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <TradeForm
              wallet={walletQuery.data}
              initialFrom={initialAsset(searchParams.get('from'), 'USD')}
              initialTo={initialAsset(searchParams.get('to'), 'EUR')}
            />
            <BalancesCard wallet={walletQuery.data} />
          </div>
          <OpenOrders />
        </>
      )}
    </div>
  )
}

function TradeForm({ wallet, initialFrom, initialTo }: { wallet: WalletResponse; initialFrom: string; initialTo: string }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('market')
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialFrom === initialTo ? (initialFrom === 'USD' ? 'EUR' : 'USD') : initialTo)
  const [amountText, setAmountText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [lastTrade, setLastTrade] = useState<TransactionResponse | null>(null)
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null)

  const crypto = isCrypto(from) || isCrypto(to)
  const quoteQuery = useQuery({
    queryKey: queryKeys.quote(from, to),
    queryFn: () => api.quote(from, to),
    // Crypto moves by the second; currency rates once a day
    refetchInterval: crypto ? 5_000 : 60_000,
  })
  const rate = quoteQuery.data?.rate
  const source = usePairSource(from, to)

  const fromDecimals = decimalsOf(from)
  const toDecimals = decimalsOf(to)
  const available = wallet.holdings.find((h) => h.currency === from)?.amount ?? 0
  const amount = Number(amountText)
  const amountValid = amountText !== '' && Number.isFinite(amount) && amount > 0
  const tooManyDecimals = amountValid && decimalsIn(amountText) > fromDecimals
  const tooMuch = amountValid && amount > available
  const target = Number(targetText)
  const targetValid = targetText !== '' && Number.isFinite(target) && target > 0

  const effectiveRate = mode === 'limit' ? (targetValid ? target : undefined) : rate
  const estimate = amountValid && effectiveRate ? floorTo(amount * effectiveRate, toDecimals) : null

  function reset() {
    setLastTrade(null)
    setLastOrder(null)
  }

  const convert = useMutation({
    mutationFn: api.convert,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.wallet, result.wallet)
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      setLastTrade(result.transaction)
      setAmountText('')
    },
  })
  const placeOrder = useMutation({
    mutationFn: api.placeOrder,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      setLastOrder(order)
      setAmountText('')
    },
  })
  const active = mode === 'market' ? convert : placeOrder
  const fieldErrors = active.error instanceof ApiError ? active.error.fieldErrors : {}

  function choose(side: 'from' | 'to', next: string) {
    if (side === 'from') {
      if (next === to) setTo(from)
      setFrom(next)
    } else {
      if (next === from) setFrom(to)
      setTo(next)
    }
    setTargetText('')
    reset()
  }

  function changeMode(next: Mode) {
    setMode(next)
    reset()
  }

  const canSubmit = amountValid && !tooMuch && !tooManyDecimals && (mode === 'market' ? rate !== undefined : targetValid)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    reset()
    if (mode === 'market') convert.mutate({ from, to, amount })
    else placeOrder.mutate({ from, to, amount, targetRate: target })
  }

  const amountError = tooManyDecimals
    ? `${from} amounts can have at most ${fromDecimals} decimal places`
    : tooMuch
      ? `You only have ${formatAmount(available, from)} ${from}`
      : fieldErrors.amount

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Segmented
          label="Order type"
          options={[
            { value: 'market', label: 'Market' },
            { value: 'limit', label: 'Limit order' },
          ]}
          value={mode}
          onChange={changeMode}
        />

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <AssetSelect label="From" value={from} onChange={(e) => choose('from', e.target.value)} />
          <button
            type="button"
            onClick={() => {
              setFrom(to)
              setTo(from)
              setTargetText('')
              reset()
            }}
            className="mx-auto grid size-10 place-items-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-100"
            aria-label="Swap assets"
            title="Swap assets"
          >
            <ArrowDownUp className="size-4 sm:rotate-90" aria-hidden />
          </button>
          <AssetSelect label="To" value={to} onChange={(e) => choose('to', e.target.value)} />
        </div>

        <div className={mode === 'limit' ? 'grid gap-4 sm:grid-cols-2' : undefined}>
          <div>
            <Field
              label={`Amount (${from})`}
              type="number"
              inputMode="decimal"
              min="0"
              step={10 ** -fromDecimals}
              placeholder={(0).toFixed(fromDecimals)}
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value)
                reset()
              }}
              error={amountError}
              hint={`Available: ${formatAmount(available, from)} ${from}`}
            />
            {available > 0 && (
              <button
                type="button"
                onClick={() => setAmountText(floorTo(available, fromDecimals).toFixed(fromDecimals))}
                className="mt-1.5 text-xs font-semibold text-accent-300 hover:underline"
              >
                Use max
              </button>
            )}
          </div>
          {mode === 'limit' && (
            <div>
              <Field
                label={`Target rate (${to} per 1 ${from})`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder={rate ? rateInput(rate) : ''}
                value={targetText}
                onChange={(e) => {
                  setTargetText(e.target.value)
                  reset()
                }}
                error={fieldErrors.targetRate}
                hint={rate ? `Now ${formatRate(rate)}. Fills when the rate reaches this or better.` : 'Fills when the rate reaches this or better.'}
              />
              {rate !== undefined && (
                <button
                  type="button"
                  onClick={() => setTargetText(rateInput(rate))}
                  className="mt-1.5 text-xs font-semibold text-accent-300 hover:underline"
                >
                  Use current rate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quote preview */}
        <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-4">
          {quoteQuery.isError ? (
            <p className="text-sm text-red-300">{quoteQuery.error.message}</p>
          ) : rate === undefined ? (
            <div className="h-12 animate-pulse rounded bg-ink-800" aria-label="Loading quote" />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-ink-400">
                  1 {from} = <span className="font-mono text-ink-100">{formatRate(rate)}</span> {to}
                </span>
                {source && <SourceBadge source={source} />}
              </div>
              <p className="mt-3 text-sm text-ink-400">{mode === 'market' ? "You'll receive about" : 'If it fills at your target, you receive at least'}</p>
              <p className="font-mono text-2xl font-semibold break-all" aria-live="polite">
                {formatMoney(estimate ?? 0, to)}
              </p>
            </>
          )}
        </div>

        {active.isError && Object.keys(fieldErrors).length === 0 && <ErrorAlert>{active.error.message}</ErrorAlert>}

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
        {lastOrder && (
          <div role="status" className="flex items-start gap-2 rounded-lg border border-accent-400/30 bg-accent-500/10 p-3 text-sm text-accent-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-300" aria-hidden />
            <span>
              Limit order placed: {formatMoney(lastOrder.amount, lastOrder.from)} → {lastOrder.to} at {formatRate(lastOrder.targetRate)} or better.
              It's checked every 10 seconds.
            </span>
          </div>
        )}

        <Button type="submit" loading={active.isPending} disabled={!canSubmit}>
          {mode === 'market' ? `Convert ${from} → ${to}` : `Place limit order ${from} → ${to}`}
        </Button>
      </form>
    </Card>
  )
}

function OpenOrders() {
  const ordersQuery = useOrders()
  const open = ordersQuery.data?.filter((o) => o.status === 'OPEN') ?? []

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
        <h2 className="font-semibold">
          Open orders {open.length > 0 && <span className="text-ink-400">({open.length})</span>}
        </h2>
        <Link to="/orders" className="text-sm font-medium text-accent-300 hover:underline">
          All orders
        </Link>
      </div>
      {ordersQuery.isPending ? (
        <div className="m-6 h-16 animate-pulse rounded-lg bg-ink-800" />
      ) : ordersQuery.isError ? (
        <div className="p-6">
          <ErrorAlert>{ordersQuery.error.message}</ErrorAlert>
        </div>
      ) : (
        <OrderList orders={open} empty="No open orders. Switch to “Limit order” to buy or sell automatically at a target rate." />
      )}
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
