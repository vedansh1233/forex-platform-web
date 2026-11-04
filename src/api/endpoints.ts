import { request } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse, WalletResponse } from './types'

export const api = {
  register: (body: RegisterRequest) => request<AuthResponse>('POST', '/api/auth/register', body),
  login: (body: LoginRequest) => request<AuthResponse>('POST', '/api/auth/login', body),
  me: () => request<UserResponse>('GET', '/api/user/me'),
  myWallet: () => request<WalletResponse>('GET', '/api/wallet/my'),
  createWallet: () => request<WalletResponse>('POST', '/api/wallet/create'),
}
