import { isCrypto } from './currencies'

/** "$1,234.56", "€90.12", or "0.01234567 BTC" for crypto. */
export function formatMoney(amount: number, currency: string): string {
  if (isCrypto(currency)) {
    return `${formatAmount(amount, currency)} ${currency}`
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

/**
 * Plain amount, no symbol: the currency's usual decimals (JPY has none), or for crypto up to
 * 8 decimals with trailing zeros trimmed (at least 2).
 */
export function formatAmount(amount: number, currency: string): string {
  if (isCrypto(currency)) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
  }
  try {
    const digits = new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}

/**
 * Rate with sensible precision: 2 decimals for large values (USD/JPY, BTC/USD), 4 for most FX
 * pairs, and 4 significant digits for tiny ones (USD/BTC = 0.00001428).
 */
export function formatRate(rate: number): string {
  if (rate !== 0 && Math.abs(rate) < 0.01) {
    return rate.toLocaleString('en-US', { maximumSignificantDigits: 4 })
  }
  const decimals = rate >= 100 ? 2 : 4
  return rate.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Crypto price in USD: "$78,283.98", or "$1.2834" under $10 so small moves stay visible. */
export function formatUsdPrice(price: number): string {
  const decimals = price >= 10 ? 2 : 4
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

/** "2026-11-03" (a calendar date, no time zone) -> "Nov 3", without UTC shifting the day. */
export function formatShortDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

export function formatLongDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(y, m - 1, d))
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
