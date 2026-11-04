import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { BellRing, Target, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { api, queryKeys } from '../../api/endpoints'
import { useOrders } from '../../hooks/useOrders'
import { formatMoney, formatRate } from '../../lib/format'
import { Card } from '../ui'

/** Open limit orders and active price alerts, each cancellable in place. */
export function ActiveOrders() {
  const queryClient = useQueryClient()
  const orders = useOrders()
  const alerts = useQuery({ queryKey: queryKeys.alerts, queryFn: api.alerts, refetchInterval: 15_000 })

  const cancelOrder = useMutation({
    mutationFn: api.cancelOrder,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  })
  const cancelAlert = useMutation({
    mutationFn: api.cancelAlert,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.alerts }),
  })

  const openOrders = orders.data?.filter((o) => o.status === 'OPEN') ?? []
  const activeAlerts = alerts.data?.filter((a) => a.status === 'ACTIVE') ?? []
  const loading = orders.isPending || alerts.isPending
  const empty = !loading && openOrders.length === 0 && activeAlerts.length === 0

  return (
    <Card className="flex flex-col p-0">
      <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
        <h2 className="font-semibold">
          Working for you
          {!loading && !empty && <span className="ml-1.5 text-ink-400">({openOrders.length + activeAlerts.length})</span>}
        </h2>
        <Link to="/orders" className="text-sm font-medium text-accent-300 hover:underline">
          Manage
        </Link>
      </div>

      {loading && <div className="m-5 h-24 animate-pulse rounded-lg bg-ink-800/60" />}

      {empty && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm text-ink-400">No open orders or alerts. Let the desk watch the market for you.</p>
          <div className="flex gap-2">
            <Link to="/trade" className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold hover:bg-ink-700">
              Place a limit order
            </Link>
            <Link to="/orders" className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold hover:bg-ink-700">
              Create an alert
            </Link>
          </div>
        </div>
      )}

      {!loading && !empty && (
        <ul className="divide-y divide-ink-800/80">
          {openOrders.map((o) => {
            // How far the rate must move for the order to fill
            const distance = o.currentRate ? ((o.targetRate - o.currentRate) / o.currentRate) * 100 : null
            const progress = distance === null ? 0 : Math.max(0, Math.min(1, 1 - Math.abs(distance) / 10))
            return (
              <Row
                key={`o${o.id}`}
                icon={<Target className="size-4 text-sky-300" aria-hidden />}
                title={
                  <>
                    {formatMoney(o.amount, o.from)} → {o.to} at <span className="font-mono">{formatRate(o.targetRate)}</span>
                  </>
                }
                detail={distance === null ? 'Waiting for a price' : distance <= 0 ? 'At target, fills on the next check' : `${distance.toFixed(2)}% to go`}
                progress={progress}
                onCancel={() => cancelOrder.mutate(o.id)}
                cancelling={cancelOrder.isPending && cancelOrder.variables === o.id}
                cancelLabel={`Cancel order ${o.from} to ${o.to}`}
              />
            )
          })}
          {activeAlerts.map((a) => {
            const distance = a.currentRate ? ((a.targetRate - a.currentRate) / a.currentRate) * 100 : null
            return (
              <Row
                key={`a${a.id}`}
                icon={<BellRing className="size-4 text-amber-300" aria-hidden />}
                title={
                  <>
                    {a.base}/{a.quote} {a.direction === 'ABOVE' ? 'above' : 'below'} <span className="font-mono">{formatRate(a.targetRate)}</span>
                  </>
                }
                detail={distance === null ? 'Watching' : `Now ${formatRate(a.currentRate!)} · ${Math.abs(distance).toFixed(2)}% away`}
                progress={distance === null ? 0 : Math.max(0, Math.min(1, 1 - Math.abs(distance) / 10))}
                onCancel={() => cancelAlert.mutate(a.id)}
                cancelling={cancelAlert.isPending && cancelAlert.variables === a.id}
                cancelLabel={`Cancel alert on ${a.base}/${a.quote}`}
              />
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/** @param progress 0–1: how close the market is to the target (full within 0%, empty at 10%+ away) */
function Row({ icon, title, detail, progress, onCancel, cancelling, cancelLabel }: {
  icon: ReactNode
  title: ReactNode
  detail: string
  progress: number
  onCancel: () => void
  cancelling: boolean
  cancelLabel: string
}) {
  return (
    <li className={clsx('flex items-center gap-3 px-5 py-3 transition-opacity', cancelling && 'opacity-50')}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-800">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-ink-800" aria-hidden>
            <div className="h-full rounded-full bg-accent-400 transition-[width] duration-700" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="truncate text-xs text-ink-400">{detail}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={cancelling}
        aria-label={cancelLabel}
        title="Cancel"
        className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  )
}
