import { useQuery } from '@tanstack/react-query'
import { Bell, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { api, queryKeys } from '../api/endpoints'
import type { AlertResponse } from '../api/types'
import { formatRate } from '../lib/format'

/**
 * Bell with the number of triggered alerts the user hasn't seen, plus a toast when an alert
 * triggers while the app is open. Polls every 15 seconds; the Orders page marks alerts as seen.
 */
export function AlertBell() {
  const alertsQuery = useQuery({ queryKey: queryKeys.alerts, queryFn: api.alerts, refetchInterval: 15_000 })
  const unseen = alertsQuery.data?.filter((a) => a.status === 'TRIGGERED' && !a.seen) ?? []
  const count = unseen.length

  return (
    <>
      <Link
        to="/orders#alerts"
        className="relative rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
        aria-label={count > 0 ? `Price alerts, ${count} new` : 'Price alerts'}
        title="Price alerts"
      >
        <Bell className="size-4" aria-hidden />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-ink-950">
            {count}
          </span>
        )}
      </Link>
      <AlertToasts unseen={unseen} loaded={alertsQuery.isSuccess} />
    </>
  )
}

function AlertToasts({ unseen, loaded }: { unseen: AlertResponse[]; loaded: boolean }) {
  const location = useLocation()
  const known = useRef<Set<number> | null>(null)
  const [toasts, setToasts] = useState<AlertResponse[]>([])

  useEffect(() => {
    // The first load only records what is already there; later loads toast what's new
    if (!loaded) return
    if (known.current === null) {
      known.current = new Set(unseen.map((a) => a.id))
      return
    }
    const added = unseen.filter((a) => !known.current!.has(a.id))
    if (added.length === 0) return
    added.forEach((a) => known.current!.add(a.id))
    setToasts((prev) => [...prev, ...added])
  }, [unseen, loaded])

  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 10_000)
    return () => clearTimeout(timer)
  }, [toasts])

  if (toasts.length === 0 || location.pathname === '/orders') return null

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-xl border border-accent-400/30 bg-ink-900 p-4 shadow-2xl shadow-black/40">
          <Bell className="mt-0.5 size-4 shrink-0 text-accent-300" aria-hidden />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">Price alert</p>
            <p className="text-ink-300">
              {a.base}/{a.quote} {a.direction === 'ABOVE' ? 'rose above' : 'fell below'} {formatRate(a.targetRate)}
              {a.triggeredRate !== null && <> (now {formatRate(a.triggeredRate)})</>}.
            </p>
            <Link to="/orders#alerts" className="mt-1 inline-block text-xs font-semibold text-accent-300 hover:underline">
              View alerts
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== a.id))}
            className="rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-100"
            aria-label="Dismiss"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}
