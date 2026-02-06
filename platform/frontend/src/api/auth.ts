import i18n from '../i18n'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

const TOKEN_KEY = 'ai-dev-jwt'
const USER_KEY = 'ai-dev-user'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const json = localStorage.getItem(USER_KEY)
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Always send X-User-Id for backward compatibility
  let userId = localStorage.getItem('ai-dev-user-id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('ai-dev-user-id', userId)
  }
  headers['X-User-Id'] = userId
  return headers
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const anonymousUserId = localStorage.getItem('ai-dev-user-id') || undefined

  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, anonymousUserId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('auth.error.registerFailed'))
  }

  const data: AuthResponse = await response.json()
  setAuth(data.token, data.user)
  return data
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('auth.error.loginFailed'))
  }

  const data: AuthResponse = await response.json()
  setAuth(data.token, data.user)
  return data
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth()
      throw new Error('Session expired')
    }
    throw new Error('Failed to get user info')
  }

  return response.json()
}

export function logout(): void {
  clearAuth()
}
