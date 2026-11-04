import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { BellRing, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { api, queryKeys } from '../api/endpoints'
import type { AlertDirection, AlertResponse } from '../api/types'
import { AssetSelect } from '../components/AssetSelect'
import { OrderList } from '../components/OrderList'
import { Button, Card, ErrorAlert, Field, Segmented } from '../components/ui'
import { useOrders } from '../hooks/useOrders'
import { isAsset } from '../lib/currencies'
import { formatDateTime, formatRate } from '../lib/format'

export function OrdersPage() {
  const [searchParams] = useSearchParams()
  const alertBase = searchParams.get('alert')

  return (
    <div className="stagger flex flex-col gap-8">
      <header>
        <p className="eyebrow">Orders</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Orders and alerts</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          Limit orders convert automatically when a rate reaches your target. Alerts just tell you. Both are checked every 10 seconds;
          crypto moves continuously, while currency rates update once per business day.
        </p>
      </header>

      <OrdersSection />
      <AlertsSection initialBase={isAsset(alertBase) ? alertBase : 'BTC'} />
    </div>
  )
}

function OrdersSection() {
  const ordersQuery = useOrders()
  const orders = ordersQuery.data ?? []
  const open = orders.filter((o) => o.status === 'OPEN')
  const closed = orders.filter((o) => o.status !== 'OPEN')

  if (ordersQuery.isError) {
    return ordersQuery.error instanceof ApiError && ordersQuery.error.status === 404 ? (
      <Card>
        <p className="text-ink-300">Open your demo wallet on the dashboard to place limit orders.</p>
      </Card>
    ) : (
      <ErrorAlert>{ordersQuery.error.message}</ErrorAlert>
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2" aria-label="Limit orders">
      <Card className="p-0">
        <div className="border-b border-ink-800 px-6 py-4">
          <h2 className="font-semibold">Open orders</h2>
        </div>
        {ordersQuery.isPending ? (
          <div className="m-6 h-16 animate-pulse rounded-lg bg-ink-800" />
        ) : (
          <OrderList orders={open} empty="No open orders. Place one from the Trade page with “Limit order”." />
        )}
      </Card>
      <Card className="p-0">
        <div className="border-b border-ink-800 px-6 py-4">
          <h2 className="font-semibold">Order history</h2>
        </div>
        {ordersQuery.isPending ? <div className="m-6 h-16 animate-pulse rounded-lg bg-ink-800" /> : <OrderList orders={closed} empty="Filled, cancelled and failed orders appear here." />}
      </Card>
    </section>
  )
}

function AlertsSection({ initialBase }: { initialBase: string }) {
  const queryClient = useQueryClient()
  const alertsQuery = useQuery({ queryKey: queryKeys.alerts, queryFn: api.alerts, refetchInterval: 15_000 })

  // Remember which alerts were new when the page opened, then mark them seen (clears the bell badge)
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  const { mutate: markSeen } = useMutation({
    mutationFn: (_ids: number[]) => api.markAlertsSeen(),
    // Keep highlighting these as "new" after the server marks them seen
    onMutate: (ids) => setFresh((prev) => new Set([...prev, ...ids])),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  })
  useEffect(() => {
    const unseen = alertsQuery.data?.filter((a) => a.status === 'TRIGGERED' && !a.seen) ?? []
    if (unseen.length > 0) markSeen(unseen.map((a) => a.id))
  }, [alertsQuery.data, markSeen])

  const cancel = useMutation({
    mutationFn: api.cancelAlert,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  })

  const alerts = alertsQuery.data ?? []
  const active = alerts.filter((a) => a.status === 'ACTIVE')
  const past = alerts.filter((a) => a.status !== 'ACTIVE')

  return (
    <section id="alerts" className="grid scroll-mt-24 gap-6 lg:grid-cols-[22rem_1fr]" aria-label="Price alerts">
      <NewAlertForm initialBase={initialBase} />
      <Card className="p-0">
        <div className="border-b border-ink-800 px-6 py-4">
          <h2 className="font-semibold">Price alerts</h2>
        </div>
        {alertsQuery.isPending && <div className="m-6 h-16 animate-pulse rounded-lg bg-ink-800" />}
        {alertsQuery.isError && (
          <div className="p-6">
            <ErrorAlert>{alertsQuery.error.message}</ErrorAlert>
          </div>
        )}
        {alertsQuery.data &&
          (alerts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-400">No alerts yet. Create one to get notified when a price crosses your target.</p>
          ) : (
            <ul className="divide-y divide-ink-800">
              {[...active, ...past].map((a) => (
                <AlertRow key={a.id} alert={a} fresh={fresh.has(a.id)} onCancel={() => cancel.mutate(a.id)} cancelling={cancel.isPending && cancel.variables === a.id} />
              ))}
            </ul>
          ))}
      </Card>
    </section>
  )
}

function AlertRow({ alert: a, fresh, onCancel, cancelling }: { alert: AlertResponse; fresh: boolean; onCancel: () => void; cancelling: boolean }) {
  const verb = a.direction === 'ABOVE' ? 'rises above' : 'falls below'
  return (
    <li className={clsx('flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3', fresh && 'bg-accent-500/10')}>
      <BellRing className={clsx('size-4 shrink-0', a.status === 'TRIGGERED' ? 'text-accent-300' : 'text-ink-400')} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-mono font-semibold">
            {a.base}/{a.quote}
          </span>{' '}
          {verb} <span className="font-mono">{formatRate(a.targetRate)}</span>
          {fresh && <span className="ml-2 rounded bg-accent-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-accent-200 uppercase">new</span>}
        </p>
        <p className="mt-0.5 text-xs text-ink-400">
          {a.status === 'TRIGGERED' && a.triggeredAt
            ? `Triggered ${formatDateTime(a.triggeredAt)} at ${a.triggeredRate !== null ? formatRate(a.triggeredRate) : '—'}`
            : a.status === 'CANCELLED'
              ? 'Cancelled'
              : `Watching · now ${a.currentRate !== null ? formatRate(a.currentRate) : '—'}`}
        </p>
      </div>
      {a.status === 'ACTIVE' && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-300 hover:bg-ink-700 hover:text-ink-100 disabled:opacity-50"
        >
          <X className="size-3.5" aria-hidden />
          Cancel
        </button>
      )}
    </li>
  )
}

function NewAlertForm({ initialBase }: { initialBase: string }) {
  const queryClient = useQueryClient()
  const [base, setBase] = useState(initialBase)
  const [quote, setQuote] = useState(initialBase === 'USD' ? 'EUR' : 'USD')
  const [direction, setDirection] = useState<AlertDirection>('ABOVE')
  const [targetText, setTargetText] = useState('')

  const quoteQuery = useQuery({ queryKey: queryKeys.quote(base, quote), queryFn: () => api.quote(base, quote), enabled: base !== quote })
  const current = quoteQuery.data?.rate

  const create = useMutation({
    mutationFn: api.createAlert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts })
      setTargetText('')
    },
  })
  const fieldErrors = create.error instanceof ApiError ? create.error.fieldErrors : {}
  const target = Number(targetText)
  const valid = base !== quote && targetText !== '' && Number.isFinite(target) && target > 0

  function choose(side: 'base' | 'quote', next: string) {
    if (side === 'base') {
      if (next === quote) setQuote(base)
      setBase(next)
    } else {
      if (next === base) setBase(quote)
      setQuote(next)
    }
    setTargetText('')
    create.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (valid) create.mutate({ base, quote, direction, targetRate: target })
  }

  return (
    <Card className="h-fit">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <h2 className="font-semibold">New price alert</h2>
        <div className="grid grid-cols-2 gap-3">
          <AssetSelect label="Asset" value={base} onChange={(e) => choose('base', e.target.value)} />
          <AssetSelect label="Priced in" value={quote} onChange={(e) => choose('quote', e.target.value)} />
        </div>
        <Segmented
          label="Direction"
          options={[
            { value: 'ABOVE', label: 'Rises above' },
            { value: 'BELOW', label: 'Falls below' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        <Field
          label={`Target (${quote} per 1 ${base})`}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder={current ? String(current) : ''}
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          error={fieldErrors.targetRate}
          hint={current ? `Now ${formatRate(current)}` : undefined}
        />
        {create.isError && Object.keys(fieldErrors).length === 0 && <ErrorAlert>{create.error.message}</ErrorAlert>}
        {create.isSuccess && <p className="text-sm text-accent-300" role="status">Alert created.</p>}
        <Button type="submit" loading={create.isPending} disabled={!valid}>
          Create alert
        </Button>
      </form>
    </Card>
  )
}
