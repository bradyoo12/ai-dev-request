import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockRequireAuth = vi.fn()
let mockAuthUser: { isAdmin?: boolean } | null = null

vi.mock('react-router-dom', () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={String(replace)}>
      Navigate to {to}
    </div>
  ),
  useLocation: () => ({ pathname: '/test', search: '', hash: '' }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    requireAuth: mockRequireAuth,
    authUser: mockAuthUser,
  }),
}))

import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthUser = null
    mockRequireAuth.mockReset()
  })

  it('redirects to "/" when not authenticated', () => {
    mockRequireAuth.mockReturnValue(false)

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/')
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true')
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockRequireAuth.mockReturnValue(true)
    mockAuthUser = { isAdmin: false }

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('calls requireAuth on component render', () => {
    mockRequireAuth.mockReturnValue(true)
    mockAuthUser = { isAdmin: false }

    render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    )

    expect(mockRequireAuth).toHaveBeenCalled()
  })

  it('renders multiple children when authenticated', () => {
    mockRequireAuth.mockReturnValue(true)
    mockAuthUser = { isAdmin: false }

    render(
      <ProtectedRoute>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('does not render children when requireAuth returns false', () => {
    mockRequireAuth.mockReturnValue(false)

    render(
      <ProtectedRoute>
        <div data-testid="should-not-render">Should not render</div>
      </ProtectedRoute>
    )

    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('redirects non-admin users when requireAdmin is set', () => {
    mockRequireAuth.mockReturnValue(true)
    mockAuthUser = { isAdmin: false }

    render(
      <ProtectedRoute requireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/')
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })

  it('renders children for admin users when requireAdmin is set', () => {
    mockRequireAuth.mockReturnValue(true)
    mockAuthUser = { isAdmin: true }

    render(
      <ProtectedRoute requireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('redirects when requireAdmin is set and authUser is null', () => {
    mockRequireAuth.mockReturnValue(true)
    mockAuthUser = null

    render(
      <ProtectedRoute requireAdmin>
        <div data-testid="admin-content">Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument()
  })
})
