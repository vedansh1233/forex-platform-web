import { ArrowLeftRight, PiggyBank } from 'lucide-react'
import type { TransactionResponse } from '../api/types'
import { formatMoney } from '../lib/format'

export function TransactionIcon({ tx }: { tx: TransactionResponse }) {
  const Icon = tx.type === 'DEPOSIT' ? PiggyBank : ArrowLeftRight
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-800 text-ink-300">
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

/** "−$100.00 → +€90.12" style amounts, or "+$10,000.00" for a deposit. Each amount stays on one line. */
export function TransactionAmounts({ tx }: { tx: TransactionResponse }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 font-mono text-sm tabular-nums">
      {tx.fromAmount !== null && tx.fromCurrency && (
        <>
          <span className="whitespace-nowrap text-ink-400">−{formatMoney(tx.fromAmount, tx.fromCurrency)}</span>
          <span className="text-ink-600" aria-hidden>
            →
          </span>
        </>
      )}
      <span className="whitespace-nowrap text-accent-300">+{formatMoney(tx.toAmount, tx.toCurrency)}</span>
    </span>
  )
}
