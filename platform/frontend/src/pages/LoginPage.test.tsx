import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/auth', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getProviders: vi.fn(() => Promise.resolve(['google', 'kakao'])),
  getAuthUrl: vi.fn(() => Promise.resolve('https://example.com/auth')),
  getOAuthCallbackUrl: vi.fn(() => 'http://localhost:5173/auth/callback/google'),
}))

import LoginPage from './LoginPage'

beforeEach(() => { vi.clearAllMocks() })

describe('LoginPage', () => {
  it('renders login form', async () => {
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={() => {}} />)
    })
    expect(screen.getByText('AI Dev Request')).toBeInTheDocument()
    expect(screen.getByText('auth.subtitle')).toBeInTheDocument()
  })

  it('renders email and password inputs', async () => {
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={() => {}} />)
    })
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('auth.passwordPlaceholder')).toBeInTheDocument()
  })

  it('renders social login buttons', async () => {
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={() => {}} />)
    })
    // The component renders buttons with provider icons; the text uses t() which returns keys
    // Default providers include google, apple, kakao, line - buttons exist for each
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('renders skip button', async () => {
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={() => {}} />)
    })
    expect(screen.getByText('auth.skipLogin')).toBeInTheDocument()
  })

  it('calls onSkip when skip clicked', async () => {
    const mockSkip = vi.fn()
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={mockSkip} />)
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('auth.skipLogin'))
    expect(mockSkip).toHaveBeenCalled()
  })

  it('switches between login and register', async () => {
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={() => {}} />)
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('auth.register'))
    expect(screen.getByPlaceholderText('auth.displayNamePlaceholder')).toBeInTheDocument()
  })

  it('renders login button', async () => {
    await act(async () => {
      render(<LoginPage onLogin={() => {}} onSkip={() => {}} />)
    })
    expect(screen.getByText('auth.loginButton')).toBeInTheDocument()
  })
})
