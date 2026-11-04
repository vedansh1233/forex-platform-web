// Pure forex math used by the Tools page. No React here, so it is easy to reason about and test.

/** Units of each currency per 1 USD, including USD itself (= 1). */
export type UsdRates = Record<string, number>

/** Adds USD = 1 to a `GET /api/rates?base=USD` rates map. */
export function withUsd(rates: Record<string, number>): UsdRates {
  return { USD: 1, ...rates }
}

/** Units of `quote` per 1 `base`, derived from USD-based rates (consistent cross rates). */
export function crossRate(usd: UsdRates, base: string, quote: string): number {
  const b = usd[base]
  const q = usd[quote]
  if (!b || !q) return NaN
  return q / b
}

/** A pip is the 4th decimal for most pairs and the 2nd for pairs quoted in yen. */
export function pipSize(quote: string): number {
  return quote === 'JPY' ? 0.01 : 0.0001
}

/**
 * Value of a one-pip move on a position of `units` of the base currency, expressed in `account`
 * currency. Only the quote currency matters: a pip is a change in the quote price.
 */
export function pipValue(usd: UsdRates, quote: string, units: number, account: string): number {
  const inQuote = units * pipSize(quote)
  return inQuote * crossRate(usd, quote, account)
}

/**
 * Position size (units of `base`) so that hitting the stop loses exactly `riskPercent` of the balance.
 * units = riskAmount / (stopPips × value of 1 pip per unit, in account currency)
 */
export function positionSize(
  usd: UsdRates,
  quote: string,
  account: string,
  balance: number,
  riskPercent: number,
  stopPips: number,
): { riskAmount: number; units: number } {
  const riskAmount = balance * (riskPercent / 100)
  const perUnitPerPip = pipValue(usd, quote, 1, account)
  const units = stopPips > 0 && perUnitPerPip > 0 ? riskAmount / (stopPips * perUnitPerPip) : NaN
  return { riskAmount, units }
}

/** Profit or loss of a closed trade, in pips and in the account currency. */
export function profitLoss(
  usd: UsdRates,
  quote: string,
  account: string,
  direction: 'buy' | 'sell',
  units: number,
  entry: number,
  exit: number,
): { pips: number; inQuote: number; inAccount: number } {
  const sign = direction === 'buy' ? 1 : -1
  const move = (exit - entry) * sign
  const inQuote = move * units
  return {
    pips: move / pipSize(quote),
    inQuote,
    inAccount: inQuote * crossRate(usd, quote, account),
  }
}

/** One series per currency: units of that currency per 1 USD, by ISO date. */
export type UsdSeries = Record<string, Map<string, number>>

/** Dates present in every series, ascending. Assumes all series came from the same source. */
export function commonDates(series: UsdSeries): string[] {
  const maps = Object.values(series)
  if (maps.length === 0) return []
  return [...maps[0]!.keys()].filter((d) => maps.every((m) => m.has(d))).sort()
}

/**
 * Currency strength: for each currency, its average % change against every other currency between
 * the first and last common date. Positive = the currency got stronger.
 */
export function currencyStrength(series: UsdSeries, currencies: readonly string[]): { currency: string; change: number }[] {
  const dates = commonDates(series)
  if (dates.length < 2) return []
  const first = dates[0]!
  const last = dates[dates.length - 1]!
  const at = (c: string, d: string) => (c === 'USD' ? 1 : series[c]!.get(d)!)

  return currencies
    .map((c) => {
      const others = currencies.filter((o) => o !== c)
      // Price of c in o = at(o)/at(c); its % change from first to last date
      const sum = others.reduce((acc, o) => {
        const start = at(o, first) / at(c, first)
        const end = at(o, last) / at(c, last)
        return acc + (end / start - 1) * 100
      }, 0)
      return { currency: c, change: sum / others.length }
    })
    .sort((a, b) => b.change - a.change)
}

/** Pearson correlation of two equal-length arrays; NaN if undefined. */
export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 3) return NaN
  let sa = 0
  let sb = 0
  for (let i = 0; i < n; i++) {
    sa += a[i]!
    sb += b[i]!
  }
  const ma = sa / n
  const mb = sb / n
  let cov = 0
  let va = 0
  let vb = 0
  for (let i = 0; i < n; i++) {
    const da = a[i]! - ma
    const db = b[i]! - mb
    cov += da * db
    va += da * da
    vb += db * db
  }
  return va === 0 || vb === 0 ? NaN : cov / Math.sqrt(va * vb)
}

/**
 * Correlation of daily returns of each currency against USD (the XXX/USD pairs).
 * +1 = they move together, −1 = they move in opposite directions.
 */
export function correlationMatrix(series: UsdSeries, currencies: readonly string[]): number[][] {
  const dates = commonDates(series)
  // Value of 1 unit of c in USD is 1 / (c per USD); log returns of that
  const returns = currencies.map((c) => {
    const values = dates.map((d) => 1 / series[c]!.get(d)!)
    return values.slice(1).map((v, i) => Math.log(v / values[i]!))
  })
  return currencies.map((_, i) => currencies.map((_, j) => (i === j ? 1 : pearson(returns[i]!, returns[j]!))))
}

// --- Market sessions ---

export interface MarketSession {
  name: string
  city: string
  timeZone: string
  /** Local opening and closing hour, Monday to Friday */
  open: number
  close: number
}

/** Main FX trading centres with their usual local business hours. */
export const SESSIONS: MarketSession[] = [
  { name: 'Sydney', city: 'Sydney', timeZone: 'Australia/Sydney', open: 7, close: 16 },
  { name: 'Tokyo', city: 'Tokyo', timeZone: 'Asia/Tokyo', open: 9, close: 18 },
  { name: 'London', city: 'London', timeZone: 'Europe/London', open: 8, close: 17 },
  { name: 'New York', city: 'New York', timeZone: 'America/New_York', open: 8, close: 17 },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Local weekday (0 = Sunday) and minutes since midnight in a time zone. */
function localClock(now: Date, timeZone: string): { weekday: number; minutes: number; label: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = Number(get('hour'))
  const minute = Number(get('minute'))
  return {
    weekday: WEEKDAYS.indexOf(get('weekday')),
    minutes: hour * 60 + minute,
    label: `${get('hour')}:${get('minute')}`,
  }
}

export interface SessionStatus {
  session: MarketSession
  isOpen: boolean
  localTime: string
  /** Minutes until the session closes (if open) or next opens (if closed) */
  minutesToChange: number
}

export function sessionStatus(session: MarketSession, now: Date): SessionStatus {
  const { weekday, minutes, label } = localClock(now, session.timeZone)
  const openMin = session.open * 60
  const closeMin = session.close * 60
  const isWeekday = weekday >= 1 && weekday <= 5
  const isOpen = isWeekday && minutes >= openMin && minutes < closeMin

  let minutesToChange: number
  if (isOpen) {
    minutesToChange = closeMin - minutes
  } else if (isWeekday && minutes < openMin) {
    minutesToChange = openMin - minutes
  } else {
    // Next weekday's open: Fri evening -> Mon, Sat -> Mon, Sun -> Mon, Mon–Thu evening -> next day
    let days = 1
    let next = (weekday + 1) % 7
    while (next === 0 || next === 6) {
      days++
      next = (next + 1) % 7
    }
    minutesToChange = 24 * 60 - minutes + (days - 1) * 24 * 60 + openMin
  }
  return { session, isOpen, localTime: label, minutesToChange }
}

export function formatDuration(minutes: number): string {
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  const m = minutes % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
