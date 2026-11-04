import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getToken, setToken, setUnauthorizedHandler } from '../api/client'
import { api } from '../api/endpoints'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../api/types'
import { AuthContext, ME_QUERY_KEY, type AuthContextValue, type AuthStatus } from './authContextValue'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(() => getToken())

  // Restore the session from a stored token by asking the backend who we are
  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: api.me,
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    queryClient.clear()
  }, [queryClient])

  // Any authenticated 401 (expired token) signs the user out
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const startSession = useCallback(
    (auth: AuthResponse) => {
      setToken(auth.token)
      setTokenState(auth.token)
      queryClient.setQueryData(ME_QUERY_KEY, auth.user)
    },
    [queryClient],
  )

  const login = useCallback(async (body: LoginRequest) => startSession(await api.login(body)), [startSession])
  const register = useCallback(
    async (body: RegisterRequest) => startSession(await api.register(body)),
    [startSession],
  )

  const value = useMemo<AuthContextValue>(() => {
    let status: AuthStatus = 'anonymous'
    if (token !== null) {
      if (meQuery.data) status = 'authenticated'
      else if (!meQuery.isError) status = 'loading'
    }
    return {
      status,
      user: status === 'authenticated' ? (meQuery.data ?? null) : null,
      login,
      register,
      logout,
    }
  }, [token, meQuery.data, meQuery.isError, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
