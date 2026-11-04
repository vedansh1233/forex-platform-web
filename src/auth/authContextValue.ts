import { createContext } from 'react'
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: UserResponse | null
  login: (body: LoginRequest) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  /** Sign in with an auth response obtained elsewhere (the one-click demo sets up its account first). */
  startSession: (auth: AuthResponse) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const ME_QUERY_KEY = ['me'] as const
