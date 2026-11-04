import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import type { StreamStatus } from '../hooks/livePricesContext'
import { formatUsdPrice } from '../lib/format'

/** A price that briefly flashes green or red when it ticks up or down. */
export function LivePrice({ price, className }: { price: number; className?: string }) {
  const previous = useRef(price)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (price === previous.current) return
    setFlash(price > previous.current ? 'up' : 'down')
    previous.current = price
    const timer = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(timer)
  }, [price])

  return (
    <span
      className={clsx(
        'rounded px-1 font-mono tabular-nums transition-colors duration-700',
        flash === 'up' && 'bg-accent-500/20 text-accent-200',
        flash === 'down' && 'bg-rose-500/20 text-rose-200',
        className,
      )}
    >
      {formatUsdPrice(price)}
      {flash && <span className="sr-only">{flash === 'up' ? ' (up)' : ' (down)'}</span>}
    </span>
  )
}

/** Small "Streaming" / "Reconnecting" indicator for the WebSocket feed. */
export function StreamIndicator({ status }: { status: StreamStatus }) {
  const live = status === 'live'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-400" title={live ? 'Prices update in real time over WebSocket' : 'Live connection lost; refreshing every 15 seconds'}>
      <span className="relative flex size-2" aria-hidden>
        {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-400 opacity-60" />}
        <span className={clsx('relative inline-flex size-2 rounded-full', live ? 'bg-accent-400' : 'bg-amber-400')} />
      </span>
      {live ? 'Streaming' : status === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
    </span>
  )
}
