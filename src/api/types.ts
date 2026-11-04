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

export interface WalletResponse {
  id: number
  fullName: string
  balance: number
  currency: string
  createdAt: string
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

/** The single error shape every backend endpoint returns. */
export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Record<string, string>
}
