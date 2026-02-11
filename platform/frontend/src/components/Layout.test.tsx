import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  useNavigate: () => mockNavigate,
  Link: ({ children, to, onClick }: any) => <a href={to} onClick={onClick}>{children}</a>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Default: authenticated user
const mockAuthValues = {
  authUser: { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: false } as any,
  tokenBalance: 500 as number | null,
  showLogin: false,
  setShowLogin: vi.fn(),
  handleLogin: vi.fn(),
  handleLogout: vi.fn(),
  requireAuth: () => true,
}

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthValues,
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
  beforeEach(() => {
    // Reset to authenticated user
    mockAuthValues.authUser = { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: false } as any
    mockAuthValues.tokenBalance = 500
    mockAuthValues.showLogin = false
  })

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

  it('renders primary navigation links for authenticated user', () => {
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

  it('renders "More" dropdown button for authenticated user', () => {
    render(<Layout />)
    expect(screen.getByText('header.more')).toBeInTheDocument()
  })

  it('shows secondary items when "More" dropdown is clicked', () => {
    render(<Layout />)
    const moreBtn = screen.getByText('header.more')
    fireEvent.click(moreBtn)
    // Secondary items should now be visible
    expect(screen.getByText('header.recommendations')).toBeInTheDocument()
    expect(screen.getByText('header.projectHealth')).toBeInTheDocument()
    expect(screen.getByText('header.teams')).toBeInTheDocument()
    expect(screen.getByText('header.whitelabel')).toBeInTheDocument()
  })

  it('shows public nav items for unauthenticated user', () => {
    mockAuthValues.authUser = null
    mockAuthValues.tokenBalance = null
    render(<Layout />)
    expect(screen.getByText('header.pricing')).toBeInTheDocument()
    expect(screen.getByText('header.howItWorks')).toBeInTheDocument()
    expect(screen.getByText('header.contact')).toBeInTheDocument()
    expect(screen.getByText('auth.login')).toBeInTheDocument()
  })

  it('does not show authenticated nav items for unauthenticated user', () => {
    mockAuthValues.authUser = null
    mockAuthValues.tokenBalance = null
    render(<Layout />)
    expect(screen.queryByText('header.mySites')).not.toBeInTheDocument()
    expect(screen.queryByText('header.suggestions')).not.toBeInTheDocument()
    expect(screen.queryByText('header.more')).not.toBeInTheDocument()
  })
})
