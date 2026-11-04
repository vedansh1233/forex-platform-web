import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../../api/client'
import { api, queryKeys } from '../../api/endpoints'
import type { TransactionResponse, WalletResponse } from '../../api/types'
import { ASSETS, decimalsOf, floorTo, isCrypto } from '../../lib/currencies'
import { formatAmount, formatMoney, formatRate } from '../../lib/format'
import { Button, Card, ErrorAlert, Segmented } from '../ui'

export type Side = 'buy' | 'sell'

/** Everything except the wallet's base currency (USD), currencies first then crypto. */
const TRADABLE = ASSETS.filter((a) => a.code !== 'USD')
const SHARES = [0.1, 0.25, 0.5, 1]

/**
 * Buy or sell any asset against USD without leaving the dashboard. `asset` and `side` are
 * controlled so the watchlist can preselect them.
 */
export function QuickTrade({ wallet, asset, side, onAssetChange, onSideChange }: {
  wallet: WalletResponse
  asset: string
  side: Side
  onAssetChange: (code: string) => void
  onSideChange: (side: Side) => void
}) {
  const queryClient = useQueryClient()
  const base = wallet.currency
  const from = side === 'buy' ? base : asset
  const to = side === 'buy' ? asset : base
  const [amountText, setAmountText] = useState('')
  const [receipt, setReceipt] = useState<TransactionResponse | null>(null)

  const quote = useQuery({
    queryKey: queryKeys.quote(from, to),
    queryFn: () => api.quote(from, to),
    refetchInterval: isCrypto(asset) ? 5_000 : 60_000,
  })
  const rate = quote.data?.rate

  const available = wallet.holdings.find((h) => h.currency === from)?.amount ?? 0
  const fromDecimals = decimalsOf(from)
  const amount = Number(amountText)
  const amountValid = amountText !== '' && Number.isFinite(amount) && amount > 0
  const decimalsTyped = amountText.includes('.') ? amountText.split('.')[1]!.length : 0
  const amountError =
    amountValid && decimalsTyped > fromDecimals
      ? `At most ${fromDecimals} decimal places`
      : amountValid && amount > available
        ? `You have ${formatMoney(available, from)}`
        : undefined
  const estimate = amountValid && rate ? floorTo(amount * rate, decimalsOf(to)) : null

  const convert = useMutation({
    mutationFn: api.convert,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.wallet, result.wallet)
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      setReceipt(result.transaction)
      setAmountText('')
    },
  })

  const canSubmit = amountValid && !amountError && rate !== undefined && !convert.isPending

  function change(next: () => void) {
    next()
    setAmountText('')
    setReceipt(null)
    convert.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    setReceipt(null)
    convert.mutate({ from, to, amount })
  }

  return (
    <Card className="flex flex-col">
      <form id="quick-trade" onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col gap-5 scroll-mt-24">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Zap className="size-4 text-accent-300" aria-hidden />
            Quick trade
          </h2>
          <Segmented
            label="Side"
            options={[
              { value: 'buy', label: 'Buy' },
              { value: 'sell', label: 'Sell' },
            ]}
            value={side}
            onChange={(next) => change(() => onSideChange(next))}
          />
        </div>

        <div role="radiogroup" aria-label="Asset" className="flex flex-wrap gap-1.5">
          {TRADABLE.map((a) => {
            const held = (wallet.holdings.find((h) => h.currency === a.code)?.amount ?? 0) > 0
            const selected = a.code === asset
            return (
              <button
                key={a.code}
                type="button"
                role="radio"
                aria-checked={selected}
                title={a.name}
                onClick={() => change(() => onAssetChange(a.code))}
                className={clsx(
                  'relative rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-all duration-200',
                  selected
                    ? 'border-accent-400/60 bg-accent-500/15 text-accent-200 shadow-[0_0_16px_-2px_rgb(16_185_129/0.5)]'
                    : 'border-ink-700 text-ink-300 hover:-translate-y-0.5 hover:border-ink-600 hover:text-ink-100',
                )}
              >
                {a.code}
                {held && <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-accent-400" aria-label="held" />}
              </button>
            )
          })}
        </div>

        <div>
          <label htmlFor="quick-amount" className="text-sm font-medium text-ink-300">
            {side === 'buy' ? `Spend (${from})` : `Sell (${from})`}
          </label>
          <div
            className={clsx(
              'mt-1.5 flex items-center rounded-xl border bg-ink-950/60 px-3 transition-colors focus-within:border-accent-400',
              amountError ? 'border-red-400/70' : 'border-ink-700',
            )}
          >
            <input
              id="quick-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step={10 ** -fromDecimals}
              placeholder={(0).toFixed(fromDecimals)}
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value)
                setReceipt(null)
              }}
              aria-invalid={amountError ? true : undefined}
              aria-describedby="quick-amount-hint"
              className="h-12 min-w-0 flex-1 bg-transparent font-mono text-xl text-ink-100 placeholder:text-ink-600 focus:outline-none"
            />
            <span className="font-mono text-sm font-semibold text-ink-400">{from}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p id="quick-amount-hint" className={clsx('text-xs', amountError ? 'text-red-300' : 'text-ink-400')}>
              {amountError ?? `Available ${formatAmount(available, from)} ${from}`}
            </p>
            <div className="flex gap-1">
              {SHARES.map((share) => (
                <button
                  key={share}
                  type="button"
                  disabled={available <= 0}
                  onClick={() => {
                    setAmountText(floorTo(available * share, fromDecimals).toFixed(fromDecimals))
                    setReceipt(null)
                  }}
                  className="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] font-semibold text-ink-300 transition-colors hover:bg-ink-700 hover:text-ink-100 disabled:opacity-40"
                >
                  {share === 1 ? 'Max' : `${share * 100}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-950/60 px-4 py-3 text-sm">
          <span className="text-ink-400">
            {rate !== undefined ? (
              <>
                1 {from} = <span className="font-mono text-ink-200">{formatRate(rate)}</span> {to}
              </>
            ) : quote.isError ? (
              <span className="text-red-300">{quote.error.message}</span>
            ) : (
              'Getting a price…'
            )}
          </span>
          <span className="text-right">
            <span className="block text-[11px] text-ink-400">You receive about</span>
            <span className="font-mono font-semibold text-ink-100" aria-live="polite">
              {formatMoney(estimate ?? 0, to)}
            </span>
          </span>
        </div>

        {convert.isError && <ErrorAlert>{convert.error instanceof ApiError ? convert.error.message : 'The trade failed'}</ErrorAlert>}
        {receipt && receipt.fromAmount !== null && receipt.fromCurrency && (
          <div role="status" className="flex animate-fade-up items-start gap-2 rounded-lg border border-accent-400/30 bg-accent-500/10 p-3 text-sm text-accent-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-300" aria-hidden />
            <span>
              {side === 'buy' ? 'Bought' : 'Sold'} <strong>{formatMoney(side === 'buy' ? receipt.toAmount : receipt.fromAmount, asset)}</strong> for{' '}
              {formatMoney(side === 'buy' ? receipt.fromAmount : receipt.toAmount, base)}.
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3">
          <Button type="submit" loading={convert.isPending} disabled={!canSubmit} className="flex-1">
            {side === 'buy' ? `Buy ${asset}` : `Sell ${asset}`}
          </Button>
          <Link
            to={`/trade?from=${from}&to=${to}`}
            className="group inline-flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-accent-300"
            title="Limit orders and any pair"
          >
            Advanced <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </form>
    </Card>
  )
}
