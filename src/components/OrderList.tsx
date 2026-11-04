import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { api, queryKeys } from '../api/endpoints'
import type { OrderResponse, OrderStatus } from '../api/types'
import { formatDateTime, formatMoney, formatPercent, formatRate } from '../lib/format'

const STATUS_STYLES: Record<OrderStatus, string> = {
  OPEN: 'bg-sky-500/15 text-sky-300',
  FILLED: 'bg-accent-500/15 text-accent-300',
  CANCELLED: 'bg-ink-700 text-ink-300',
  FAILED: 'bg-rose-500/15 text-rose-300',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx('rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase', STATUS_STYLES[status])}>
      {status.toLowerCase()}
    </span>
  )
}

/** List of limit orders; open ones show the distance to target and can be cancelled. */
export function OrderList({ orders, empty }: { orders: OrderResponse[]; empty: string }) {
  const queryClient = useQueryClient()
  const cancel = useMutation({
    mutationFn: api.cancelOrder,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
  })

  if (orders.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-ink-400">{empty}</p>
  }

  return (
    <ul className="divide-y divide-ink-800">
      {orders.map((o) => {
        // How far the market must move for the order to fill (positive = rate must rise)
        const distance = o.currentRate ? ((o.targetRate - o.currentRate) / o.currentRate) * 100 : null
        return (
          <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  {o.from} → {o.to}
                </span>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-0.5 text-xs text-ink-400">
                Sell <span className="whitespace-nowrap text-ink-300">{formatMoney(o.amount, o.from)}</span> when 1 {o.from} ≥{' '}
                <span className="font-mono text-ink-300">{formatRate(o.targetRate)}</span> {o.to} · {formatDateTime(o.createdAt)}
              </p>
              {o.status === 'FAILED' && o.failureReason && <p className="mt-0.5 text-xs text-rose-300">{o.failureReason}</p>}
            </div>

            {o.status === 'OPEN' && (
              <div className="text-right text-xs">
                <p className="text-ink-400">
                  Now <span className="font-mono text-ink-100">{o.currentRate ? formatRate(o.currentRate) : '—'}</span>
                </p>
                {distance !== null && (
                  <p className={distance <= 0 ? 'text-accent-300' : 'text-ink-400'}>
                    {distance <= 0 ? 'Target reached, filling soon' : `${formatPercent(distance)} to go`}
                  </p>
                )}
              </div>
            )}
            {o.status === 'FILLED' && o.receivedAmount !== null && (
              <div className="text-right text-xs">
                <p className="font-mono text-sm whitespace-nowrap text-accent-300">+{formatMoney(o.receivedAmount, o.to)}</p>
                <p className="text-ink-400">at {o.fillRate !== null ? formatRate(o.fillRate) : '—'}</p>
              </div>
            )}

            {o.status === 'OPEN' && (
              <button
                type="button"
                onClick={() => cancel.mutate(o.id)}
                disabled={cancel.isPending && cancel.variables === o.id}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-300 hover:bg-ink-700 hover:text-ink-100 disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden />
                Cancel
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
