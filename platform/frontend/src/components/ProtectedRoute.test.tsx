import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockNavigate = vi.fn()
const mockRequireAuth = vi.fn()

vi.mock('react-router-dom', () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={String(replace)}>
      Navigate to {to}
    </div>
  ),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    requireAuth: mockRequireAuth,
  }),
}))

import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
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

    render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    )

    expect(mockRequireAuth).toHaveBeenCalled()
  })

  it('renders multiple children when authenticated', () => {
    mockRequireAuth.mockReturnValue(true)

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
})
