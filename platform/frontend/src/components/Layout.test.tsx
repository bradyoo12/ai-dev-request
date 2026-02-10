import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    authUser: { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: false },
    tokenBalance: 500,
    showLogin: false,
    setShowLogin: vi.fn(),
    handleLogin: vi.fn(),
    handleLogout: vi.fn(),
    requireAuth: () => true,
  }),
}))

vi.mock('./LanguageSelector', () => ({
  default: () => <div data-testid="lang-selector">LanguageSelector</div>,
}))

vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">LoginPage</div>,
}))

vi.mock('./FooterSection', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}))

import Layout from './Layout'

describe('Layout', () => {
  it('renders header with brand', () => {
    render(<Layout />)
    expect(screen.getByText(/AI Dev Request/)).toBeInTheDocument()
  })

  it('renders outlet', () => {
    render(<Layout />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('renders footer', () => {
    render(<Layout />)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Layout />)
    expect(screen.getByText('header.mySites')).toBeInTheDocument()
    expect(screen.getByText('header.suggestions')).toBeInTheDocument()
    expect(screen.getByText('header.settings')).toBeInTheDocument()
  })

  it('renders user display name', () => {
    render(<Layout />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders token balance', () => {
    render(<Layout />)
    expect(screen.getByText('settings.tokens.headerBalance')).toBeInTheDocument()
  })

  it('renders language selector', () => {
    render(<Layout />)
    expect(screen.getByTestId('lang-selector')).toBeInTheDocument()
  })
})
