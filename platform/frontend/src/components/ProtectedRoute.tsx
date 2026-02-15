import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const RETURN_URL_KEY = 'auth-return-url'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin: adminRequired }: ProtectedRouteProps) {
  const { requireAuth, authUser } = useAuth()
  const location = useLocation()

  if (!requireAuth()) {
    // Save the intended destination so the user is redirected back after login
    const returnUrl = location.pathname + location.search + location.hash
    if (returnUrl && returnUrl !== '/') {
      sessionStorage.setItem(RETURN_URL_KEY, returnUrl)
    }
    return <Navigate to="/" replace />
  }

  if (adminRequired && !authUser?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
