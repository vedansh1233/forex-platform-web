import type { TransactionResponse } from '../api/types'

export function transactionTitle(tx: TransactionResponse): string {
  return tx.type === 'DEPOSIT' ? 'Demo funds deposited' : `${tx.fromCurrency} → ${tx.toCurrency}`
}
