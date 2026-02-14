import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../i18n', () => ({
  default: { t: (key: string) => key },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockStorage: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
    clear: vi.fn(() => Object.keys(mockStorage).forEach(k => delete mockStorage[k])),
  },
  writable: true,
})

import {
  getToken,
  getStoredUser,
  setAuth,
  clearAuth,
  isAuthenticated,
  getAuthHeaders,
  authFetch,
  AUTH_EXPIRED_EVENT,
  register,
  login,
  socialLogin,
  getProviders,
  getAuthUrl,
  getMe,
  logout,
  getOAuthCallbackUrl,
} from './auth'
import type { AuthUser } from './auth'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
})

describe('auth api', () => {
  const mockUser: AuthUser = {
    id: '1',
    email: 'test@test.com',
    displayName: 'Test',
    createdAt: '2024-01-01',
  }

  describe('getToken', () => {
    it('returns null when no token stored', () => {
      expect(getToken()).toBeNull()
    })

    it('returns token when stored', () => {
      mockStorage['ai-dev-jwt'] = 'test-token'
      expect(getToken()).toBe('test-token')
    })
  })

  describe('getStoredUser', () => {
    it('returns null when no user stored', () => {
      expect(getStoredUser()).toBeNull()
    })

    it('returns user when stored', () => {
      mockStorage['ai-dev-user'] = JSON.stringify(mockUser)
      expect(getStoredUser()).toEqual(mockUser)
    })

    it('returns null for invalid JSON', () => {
      mockStorage['ai-dev-user'] = 'not-json'
      expect(getStoredUser()).toBeNull()
    })
  })

  describe('setAuth', () => {
    it('stores token and user', () => {
      setAuth('token123', mockUser)
      expect(window.localStorage.setItem).toHaveBeenCalledWith('ai-dev-jwt', 'token123')
      expect(window.localStorage.setItem).toHaveBeenCalledWith('ai-dev-user', JSON.stringify(mockUser))
    })
  })

  describe('clearAuth', () => {
    it('removes token and user', () => {
      clearAuth()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ai-dev-jwt')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ai-dev-user')
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when no token', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('returns true when token exists', () => {
      mockStorage['ai-dev-jwt'] = 'token'
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('getAuthHeaders', () => {
    it('returns content-type header without token', () => {
      const headers = getAuthHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['Authorization']).toBeUndefined()
    })

    it('includes authorization when token exists', () => {
      mockStorage['ai-dev-jwt'] = 'my-token'
      const headers = getAuthHeaders()
      expect(headers['Authorization']).toBe('Bearer my-token')
    })
  })

  describe('register', () => {
    it('registers successfully', async () => {
      const authResponse = { token: 'new-token', user: mockUser }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(authResponse),
      })

      const result = await register('test@test.com', 'password123', 'Test')
      expect(result).toEqual(authResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Registration failed' }),
      })

      await expect(register('test@test.com', 'pass')).rejects.toThrow('Registration failed')
    })
  })

  describe('login', () => {
    it('logs in successfully', async () => {
      const authResponse = { token: 'token', user: mockUser }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(authResponse),
      })

      const result = await login('test@test.com', 'password')
      expect(result).toEqual(authResponse)
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      await expect(login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('socialLogin', () => {
    it('logs in with social provider', async () => {
      const authResponse = { token: 'social-token', user: mockUser }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(authResponse),
      })

      const result = await socialLogin('google', 'auth-code', 'http://localhost/callback')
      expect(result).toEqual(authResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/google'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      await expect(socialLogin('google', 'code', 'uri')).rejects.toThrow()
    })
  })

  describe('getProviders', () => {
    it('returns providers from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ providers: ['google', 'kakao'] }),
      })

      const result = await getProviders()
      expect(result).toEqual(['google', 'kakao'])
    })

    it('returns default providers on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await getProviders()
      expect(result).toEqual(['google'])
    })

    it('returns default providers on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getProviders()
      expect(result).toEqual(['google'])
    })
  })

  describe('getAuthUrl', () => {
    it('returns auth URL', async () => {
      // Mock crypto.randomUUID
      vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: 'https://accounts.google.com/auth' }),
      })

      const result = await getAuthUrl('google', 'http://localhost/callback')
      expect(result).toBe('https://accounts.google.com/auth')
    })

    it('throws on failure', async () => {
      vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

      mockFetch.mockResolvedValueOnce({ ok: false })

      await expect(getAuthUrl('google', 'uri')).rejects.toThrow()
    })
  })

  describe('getMe', () => {
    it('returns current user', async () => {
      mockStorage['ai-dev-jwt'] = 'valid-token'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })

      const result = await getMe()
      expect(result).toEqual(mockUser)
    })

    it('throws when not authenticated', async () => {
      await expect(getMe()).rejects.toThrow('Not authenticated')
    })

    it('clears auth on 401', async () => {
      mockStorage['ai-dev-jwt'] = 'expired-token'
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await expect(getMe()).rejects.toThrow('Session expired')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ai-dev-jwt')
    })
  })

  describe('logout', () => {
    it('clears auth data', () => {
      logout()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ai-dev-jwt')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ai-dev-user')
    })
  })

  describe('getOAuthCallbackUrl', () => {
    it('returns callback URL for provider', () => {
      const url = getOAuthCallbackUrl('google')
      expect(url).toContain('/auth/callback/google')
    })
  })

  describe('authFetch', () => {
    it('attaches auth headers and returns response', async () => {
      mockStorage['ai-dev-jwt'] = 'my-token'
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ data: 1 }) })

      const response = await authFetch('http://localhost/api/test')
      expect(response.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        })
      )
    })

    it('clears auth and dispatches event on 401', async () => {
      mockStorage['ai-dev-jwt'] = 'expired-token'
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

      const eventListener = vi.fn()
      window.addEventListener(AUTH_EXPIRED_EVENT, eventListener)

      await expect(authFetch('http://localhost/api/test')).rejects.toThrow()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ai-dev-jwt')
      expect(eventListener).toHaveBeenCalled()

      window.removeEventListener(AUTH_EXPIRED_EVENT, eventListener)
    })

    it('passes through non-401 errors without clearing auth', async () => {
      mockStorage['ai-dev-jwt'] = 'valid-token'
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

      const response = await authFetch('http://localhost/api/test')
      expect(response.status).toBe(500)
    })
  })
})
