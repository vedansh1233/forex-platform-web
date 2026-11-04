// Mirrors the backend DTOs (see forex-platform CLAUDE.md "API contract").
// The live OpenAPI spec is at `${VITE_API_URL}/v3/api-docs`.

export interface UserResponse {
  id: number
  fullName: string
  email: string
  role: string
  createdAt: string // ISO-8601 LocalDateTime
}

export interface AuthResponse {
  token: string
  tokenType: 'Bearer'
  expiresIn: number // seconds
  user: UserResponse
}

export interface HoldingResponse {
  currency: string
  amount: number
  /** Value in the wallet's base currency; null if rates are unavailable */
  valueInBase: number | null
}

export interface WalletResponse {
  id: number
  fullName: string
  /** Cash in the base currency (USD) */
  balance: number
  /** Base currency */
  currency: string
  createdAt: string
  /** Every currency with a non-zero amount, base currency first */
  holdings: HoldingResponse[]
  /** Whole wallet valued in the base currency; null if rates are unavailable */
  totalValue: number | null
  valuationDate: string | null
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

/**
 * Where prices came from: "ECB" = live currency reference rates, "COINBASE" = live crypto prices,
 * "SIMULATED" = fallback when the live source is down.
 */
export type RatesSource = 'ECB' | 'COINBASE' | 'SIMULATED'

export type AssetType = 'FIAT' | 'CRYPTO'

export interface AssetResponse {
  code: string
  name: string
  type: AssetType
  decimals: number
  minAmount: number
}

export interface QuoteResponse {
  from: string
  to: string
  /** Units of `to` per 1 `from` */
  rate: number
}

export interface CryptoPrice {
  symbol: string
  name: string
  priceUsd: number
  /** Percent change over 24 hours */
  change24h: number
}

/** GET /api/market/crypto, and every message on the /ws/prices WebSocket */
export interface CryptoPricesResponse {
  source: RatesSource
  updatedAt: string // ISO instant
  prices: CryptoPrice[]
}

export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED' | 'FAILED'

export interface PlaceOrderRequest {
  from: string
  to: string
  amount: number
  /** Fill once 1 `from` buys at least this many `to` */
  targetRate: number
}

export interface OrderResponse {
  id: number
  from: string
  to: string
  amount: number
  targetRate: number
  status: OrderStatus
  createdAt: string
  closedAt: string | null
  /** Latest rate while OPEN; null otherwise */
  currentRate: number | null
  fillRate: number | null
  receivedAmount: number | null
  transactionId: number | null
  failureReason: string | null
}

export type AlertDirection = 'ABOVE' | 'BELOW'
export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'CANCELLED'

export interface CreateAlertRequest {
  base: string
  quote: string
  direction: AlertDirection
  targetRate: number
}

export interface AlertResponse {
  id: number
  base: string
  quote: string
  direction: AlertDirection
  targetRate: number
  status: AlertStatus
  /** false for a TRIGGERED alert the user hasn't acknowledged yet */
  seen: boolean
  createdAt: string
  triggeredAt: string | null
  triggeredRate: number | null
  /** Latest rate while ACTIVE; null otherwise */
  currentRate: number | null
}

export interface RatesResponse {
  base: string
  date: string // ISO date
  source: RatesSource
  /** Units of each currency per 1 base */
  rates: Record<string, number>
}

export interface RateHistoryResponse {
  base: string
  quote: string
  source: RatesSource
  points: { date: string; rate: number }[]
}

export interface ConvertRequest {
  from: string
  to: string
  amount: number
}

export type TransactionType = 'DEPOSIT' | 'CONVERSION'

export interface TransactionResponse {
  id: number
  type: TransactionType
  fromCurrency: string | null
  fromAmount: number | null
  toCurrency: string
  toAmount: number
  rate: number | null
  createdAt: string
}

export interface ConversionResponse {
  transaction: TransactionResponse
  wallet: WalletResponse
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

/** The single error shape every backend endpoint returns. */
export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Record<string, string>
}
