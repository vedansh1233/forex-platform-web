import type { ErrorResponse } from './types'

export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const TOKEN_KEY = 'fxdesk.token'

/** Thrown for any non-2xx response or network failure. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// --- token storage (localStorage can throw in private modes, so guard it) ---

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore: the session just won't survive a reload
  }
}

// Called when an authenticated request comes back 401 (expired or revoked token)
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

// --- request helper ---

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, `Can't reach the server at ${API_URL}. Is the backend running?`)
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  const error = await readError(response)

  if (response.status === 401 && token) {
    onUnauthorized?.()
  }

  throw error
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as Partial<ErrorResponse>
    return new ApiError(
      response.status,
      data.message ?? response.statusText ?? 'Request failed',
      data.fieldErrors ?? {},
    )
  } catch {
    return new ApiError(response.status, response.statusText || `Request failed (${response.status})`)
  }
}
