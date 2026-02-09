import i18n from '../i18n'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

const TOKEN_KEY = 'ai-dev-jwt'
const USER_KEY = 'ai-dev-user'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  profileImageUrl?: string
  isAdmin?: boolean
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export type SocialProvider = 'google' | 'apple' | 'line' | 'kakao'

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

export async function socialLogin(
  provider: SocialProvider,
  code: string,
  redirectUri: string
): Promise<AuthResponse> {
  const anonymousUserId = localStorage.getItem('ai-dev-user-id') || undefined

  const response = await fetch(`${API_BASE_URL}/api/auth/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri, anonymousUserId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('auth.error.loginFailed'))
  }

  const data: AuthResponse = await response.json()
  setAuth(data.token, data.user)
  return data
}

export async function getProviders(): Promise<SocialProvider[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/providers`)
    if (!response.ok) return ['google', 'apple', 'kakao', 'line']
    const data = await response.json()
    return data.providers
  } catch {
    return ['google', 'apple', 'kakao', 'line']
  }
}

export async function getAuthUrl(provider: SocialProvider, redirectUri: string): Promise<string> {
  const state = crypto.randomUUID()
  localStorage.setItem('oauth-state', state)
  localStorage.setItem('oauth-provider', provider)

  const response = await fetch(
    `${API_BASE_URL}/api/auth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`
  )

  if (!response.ok) {
    throw new Error(`Failed to get auth URL for ${provider}`)
  }

  const data = await response.json()
  return data.url
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

export function getOAuthCallbackUrl(provider: SocialProvider): string {
  return `${window.location.origin}/auth/callback/${provider}`
}
