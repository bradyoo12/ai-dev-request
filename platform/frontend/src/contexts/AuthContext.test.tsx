import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('../api/auth', () => ({
  getStoredUser: vi.fn(() => null),
  logout: vi.fn(),
  socialLogin: vi.fn(),
  isAuthenticated: vi.fn(() => false),
  AUTH_EXPIRED_EVENT: 'auth-expired',
}))

vi.mock('../api/settings', () => ({
  getTokenOverview: vi.fn(() => Promise.resolve({ balance: 100 })),
}))

import { AuthProvider, useAuth } from './AuthContext'
import { isAuthenticated } from '../api/auth'
import { getTokenOverview } from '../api/settings'

function TestConsumer() {
  const ctx = useAuth()
  return (
    <div>
      <span data-testid="user">{ctx.authUser ? ctx.authUser.email : 'none'}</span>
      <span data-testid="balance">{ctx.tokenBalance ?? 'null'}</span>
      <span data-testid="showLogin">{String(ctx.showLogin)}</span>
      <button data-testid="login" onClick={() => ctx.handleLogin({ id: '1', email: 'a@b.com', displayName: 'A', isAdmin: false, createdAt: '2026-01-01T00:00:00Z' })}>login</button>
      <button data-testid="logout" onClick={ctx.handleLogout}>logout</button>
      <button data-testid="requireAuth" onClick={() => { const r = ctx.requireAuth(); document.title = String(r) }}>requireAuth</button>
    </div>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthContext', () => {
  it('renders children', async () => {
    await act(async () => {
      render(<AuthProvider><div data-testid="child">Hello</div></AuthProvider>)
    })
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('useAuth returns context values', async () => {
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('showLogin')).toHaveTextContent('false')
  })

  it('handleLogin sets user state', async () => {
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })
    await act(async () => {
      screen.getByTestId('login').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('a@b.com')
  })

  it('handleLogout clears user state', async () => {
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })
    await act(async () => {
      screen.getByTestId('login').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('a@b.com')
    await act(async () => {
      screen.getByTestId('logout').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('requireAuth shows login when not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })
    await act(async () => {
      screen.getByTestId('requireAuth').click()
    })
    expect(screen.getByTestId('showLogin')).toHaveTextContent('true')
  })

  it('loads token balance on mount', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(getTokenOverview).mockResolvedValue({ balance: 250 } as any)
    await act(async () => {
      render(<AuthProvider><TestConsumer /></AuthProvider>)
    })
    expect(screen.getByTestId('balance')).toHaveTextContent('250')
  })

  it('useAuth throws outside provider', () => {
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})
