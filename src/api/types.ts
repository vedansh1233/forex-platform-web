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

/** "ECB" = live reference rates; "SIMULATED" = fallback when the live source is down */
export type RatesSource = 'ECB' | 'SIMULATED'

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
