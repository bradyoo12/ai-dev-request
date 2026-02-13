import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getStoredUser, logout as apiLogout, socialLogin, isAuthenticated, AUTH_EXPIRED_EVENT } from '../api/auth'
import type { AuthUser, SocialProvider } from '../api/auth'
import { getTokenOverview } from '../api/settings'
import { apiCache } from '../utils/apiCache'

interface AuthContextType {
  authUser: AuthUser | null
  tokenBalance: number | null
  showLogin: boolean
  setShowLogin: (show: boolean) => void
  handleLogin: (user: AuthUser) => void
  handleLogout: () => void
  loadTokenBalance: () => Promise<void>
  setTokenBalance: (balance: number | null) => void
  requireAuth: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(getStoredUser())
  const [showLogin, setShowLogin] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)

  const loadTokenBalance = useCallback(async () => {
    if (!isAuthenticated()) return
    try {
      // Use stale-while-revalidate to return cached data immediately
      // This prevents blocking page loads while fetching token balance
      const overview = await apiCache.get(
        'token-balance',
        () => getTokenOverview(),
        60000, // Cache for 60 seconds
        true // Use stale-while-revalidate for instant response
      )
      setTokenBalance(overview.balance)
    } catch {
      // Auth expiry is handled by authFetch via AUTH_EXPIRED_EVENT
    }
  }, [])

  const handleLogin = useCallback((user: AuthUser) => {
    setAuthUser(user)
    setShowLogin(false)
    loadTokenBalance()
  }, [loadTokenBalance])

  const handleLogout = useCallback(() => {
    apiLogout()
    setAuthUser(null)
    setTokenBalance(null)
    // Clear all caches on logout
    apiCache.clear()
  }, [])

  const requireAuth = useCallback(() => {
    if (!isAuthenticated()) {
      setShowLogin(true)
      return false
    }
    return true
  }, [])

  useEffect(() => {
    loadTokenBalance()
  }, [loadTokenBalance])

  // Handle auth expiration (401 responses)
  useEffect(() => {
    const handleExpired = () => {
      setAuthUser(null)
      setTokenBalance(null)
      setShowLogin(true)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [])

  // Handle OAuth callback
  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/^\/auth\/callback\/(google|kakao|line|apple)$/)
    if (!match) return

    const provider = match[1] as SocialProvider
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const state = params.get('state')
    const savedState = localStorage.getItem('oauth-state')

    // Clean up URL immediately
    window.history.replaceState({}, '', '/')

    // Handle OAuth error (e.g. user denied consent)
    if (error) {
      const errorDesc = params.get('error_description') || error
      console.error(`OAuth callback error for ${provider}:`, errorDesc)
      setShowLogin(true)
      return
    }

    if (!code) return
    if (state && savedState && state !== savedState) {
      console.error('OAuth state mismatch — possible CSRF or stale callback')
      setShowLogin(true)
      return
    }

    localStorage.removeItem('oauth-state')
    localStorage.removeItem('oauth-provider')

    const redirectUri = `${window.location.origin}/auth/callback/${provider}`
    socialLogin(provider, code, redirectUri)
      .then((result) => {
        handleLogin(result.user)
      })
      .catch((err) => {
        console.error('Social login failed:', err)
        setShowLogin(true)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{
      authUser,
      tokenBalance,
      showLogin,
      setShowLogin,
      handleLogin,
      handleLogout,
      loadTokenBalance,
      setTokenBalance,
      requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
