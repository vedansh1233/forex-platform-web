import { request } from './client'
import type {
  AuthResponse,
  ConversionResponse,
  ConvertRequest,
  LoginRequest,
  PageResponse,
  RateHistoryResponse,
  RatesResponse,
  RegisterRequest,
  TransactionResponse,
  UserResponse,
  WalletResponse,
} from './types'

const qs = (params: Record<string, string | number>) => new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

export const api = {
  register: (body: RegisterRequest) => request<AuthResponse>('POST', '/api/auth/register', body),
  login: (body: LoginRequest) => request<AuthResponse>('POST', '/api/auth/login', body),
  me: () => request<UserResponse>('GET', '/api/user/me'),

  myWallet: () => request<WalletResponse>('GET', '/api/wallet/my'),
  createWallet: () => request<WalletResponse>('POST', '/api/wallet/create'),
  convert: (body: ConvertRequest) => request<ConversionResponse>('POST', '/api/wallet/convert', body),
  transactions: (page: number, size: number) =>
    request<PageResponse<TransactionResponse>>('GET', `/api/wallet/transactions?${qs({ page, size })}`),

  currencies: () => request<string[]>('GET', '/api/rates/currencies'),
  rates: (base: string) => request<RatesResponse>('GET', `/api/rates?${qs({ base })}`),
  rateHistory: (base: string, quote: string, days: number) =>
    request<RateHistoryResponse>('GET', `/api/rates/history?${qs({ base, quote, days })}`),
}

/** Query keys shared across pages so caches stay consistent after mutations. */
export const queryKeys = {
  wallet: ['wallet'] as const,
  transactions: ['transactions'] as const,
  transactionsPage: (page: number, size: number) => ['transactions', page, size] as const,
  rates: (base: string) => ['rates', base] as const,
  history: (base: string, quote: string, days: number) => ['history', base, quote, days] as const,
}
