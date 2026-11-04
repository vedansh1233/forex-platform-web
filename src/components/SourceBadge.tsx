import clsx from 'clsx'
import { FlaskConical, Radio } from 'lucide-react'
import type { RatesSource } from '../api/types'
import { formatLongDay } from '../lib/format'

/** Tells the user whether rates are live ECB data or the simulated fallback. */
export function SourceBadge({ source, date }: { source: RatesSource; date?: string }) {
  const live = source === 'ECB'
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        live ? 'border-accent-400/30 bg-accent-500/10 text-accent-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-200',
      )}
      title={
        live
          ? 'European Central Bank reference rates, published each business day'
          : 'The live rates source is unavailable, so simulated rates are shown'
      }
    >
      {live ? <Radio className="size-3.5" aria-hidden /> : <FlaskConical className="size-3.5" aria-hidden />}
      {live ? 'Live ECB rates' : 'Simulated rates'}
      {date && <span className="text-ink-400">· {formatLongDay(date)}</span>}
    </span>
  )
}
