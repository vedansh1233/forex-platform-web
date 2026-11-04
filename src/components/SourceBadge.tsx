import clsx from 'clsx'
import { FlaskConical, Radio } from 'lucide-react'
import type { RatesSource } from '../api/types'
import { formatLongDay } from '../lib/format'

const LABELS: Record<RatesSource, { label: string; title: string }> = {
  ECB: { label: 'Live ECB rates', title: 'European Central Bank reference rates, published each business day' },
  COINBASE: { label: 'Live Coinbase prices', title: 'Crypto prices from Coinbase Exchange public market data' },
  SIMULATED: { label: 'Simulated rates', title: 'The live source is unavailable, so simulated prices are shown' },
}

/** Tells the user whether prices are live (ECB, Coinbase) or the simulated fallback. */
export function SourceBadge({ source, date }: { source: RatesSource; date?: string }) {
  const live = source !== 'SIMULATED'
  const { label, title } = LABELS[source] ?? LABELS.SIMULATED
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        live ? 'border-accent-400/30 bg-accent-500/10 text-accent-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-200',
      )}
      title={title}
    >
      {live ? <Radio className="size-3.5" aria-hidden /> : <FlaskConical className="size-3.5" aria-hidden />}
      {label}
      {date && <span className="text-ink-400">· {formatLongDay(date)}</span>}
    </span>
  )
}
