import type { AssetType } from '../api/types'

/**
 * Every tradable asset, mirroring the backend's `GET /api/market/assets` (keep in sync):
 * 8 currencies, then 5 cryptocurrencies. Currencies allow 2 decimals, crypto 8.
 */
export const ASSETS: { code: string; name: string; type: AssetType; decimals: number }[] = [
  { code: 'USD', name: 'US Dollar', type: 'FIAT', decimals: 2 },
  { code: 'EUR', name: 'Euro', type: 'FIAT', decimals: 2 },
  { code: 'GBP', name: 'British Pound', type: 'FIAT', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', type: 'FIAT', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', type: 'FIAT', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', type: 'FIAT', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', type: 'FIAT', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', type: 'FIAT', decimals: 2 },
  { code: 'BTC', name: 'Bitcoin', type: 'CRYPTO', decimals: 8 },
  { code: 'ETH', name: 'Ethereum', type: 'CRYPTO', decimals: 8 },
  { code: 'SOL', name: 'Solana', type: 'CRYPTO', decimals: 8 },
  { code: 'XRP', name: 'XRP', type: 'CRYPTO', decimals: 8 },
  { code: 'ADA', name: 'Cardano', type: 'CRYPTO', decimals: 8 },
]

const BY_CODE = new Map(ASSETS.map((a) => [a.code, a]))

/** Currencies the backend supports, in its canonical order (GET /api/rates/currencies). */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'] as const

export const CRYPTO_CODES = ASSETS.filter((a) => a.type === 'CRYPTO').map((a) => a.code)

export function isAsset(code: string | null | undefined): code is string {
  return !!code && BY_CODE.has(code)
}

export function isCrypto(code: string): boolean {
  return BY_CODE.get(code)?.type === 'CRYPTO'
}

/** Decimal places allowed for amounts of this asset (2 for currencies, 8 for crypto). */
export function decimalsOf(code: string): number {
  return BY_CODE.get(code)?.decimals ?? 2
}

/** Asset name, e.g. "Euro" or "Bitcoin" (falls back to the code). */
export function currencyName(code: string): string {
  return BY_CODE.get(code)?.name ?? code
}

/** Truncate (not round) to the asset's decimals, matching the backend's round-down. */
export function floorTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.floor(value * factor + 1e-6) / factor
}
