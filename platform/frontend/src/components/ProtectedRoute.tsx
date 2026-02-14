import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const RETURN_URL_KEY = 'auth-return-url'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { requireAuth } = useAuth()
  const location = useLocation()

  if (!requireAuth()) {
    // Save the intended destination so the user is redirected back after login
    const returnUrl = location.pathname + location.search + location.hash
    if (returnUrl && returnUrl !== '/') {
      sessionStorage.setItem(RETURN_URL_KEY, returnUrl)
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
