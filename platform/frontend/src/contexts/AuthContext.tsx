import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser, logout as apiLogout, socialLogin, isAuthenticated, AUTH_EXPIRED_EVENT } from '../api/auth'
import type { AuthUser, SocialProvider } from '../api/auth'
import { getTokenOverview } from '../api/settings'
import { apiCache } from '../utils/apiCache'

const RETURN_URL_KEY = 'auth-return-url'

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
  const navigate = useNavigate()
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

    // Redirect to the saved return URL (set by ProtectedRoute) if available
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY)
    if (returnUrl) {
      sessionStorage.removeItem(RETURN_URL_KEY)
      navigate(returnUrl, { replace: true })
    }
  }, [loadTokenBalance, navigate])

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
  // Clear auth state but do NOT force the login modal open — let users
  // continue browsing public pages. The login modal only appears when
  // a user explicitly triggers requireAuth() (e.g., submitting a form
  // or navigating to a protected route).
  useEffect(() => {
    const handleExpired = () => {
      setAuthUser(null)
      setTokenBalance(null)
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

    // Navigate to home page immediately to clear the loading spinner
    // Use replace: true to avoid adding to browser history
    navigate('/', { replace: true })

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
      .then(() => {
        // Set flag in sessionStorage before reload to show loading state
        // This prevents the UI flash of non-authenticated state during reload
        sessionStorage.setItem('auth-reloading', 'true')
        // Force page reload to load stored auth from localStorage
        // This ensures React state is properly initialized with the authenticated user
        window.location.href = '/'
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
