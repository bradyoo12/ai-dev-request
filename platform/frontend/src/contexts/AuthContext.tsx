import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getStoredUser, logout as apiLogout, socialLogin, isAuthenticated } from '../api/auth'
import type { AuthUser, SocialProvider } from '../api/auth'
import { getTokenOverview } from '../api/settings'

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
    try {
      const overview = await getTokenOverview()
      setTokenBalance(overview.balance)
    } catch {
      // Silently fail - header balance is optional
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

  // Handle OAuth callback
  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/^\/auth\/callback\/(google|kakao|line|apple)$/)
    if (!match) return

    const provider = match[1] as SocialProvider
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = localStorage.getItem('oauth-state')

    // Clean up URL immediately
    window.history.replaceState({}, '', '/')

    if (!code) return
    if (state && savedState && state !== savedState) return

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
