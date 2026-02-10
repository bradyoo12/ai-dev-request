import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    setTokenBalance: vi.fn(),
  }),
}))

vi.mock('../api/requests', () => ({
  createRequest: vi.fn(),
  analyzeRequest: vi.fn(),
  generateProposal: vi.fn(),
  approveProposal: vi.fn(),
  startBuild: vi.fn(),
  exportZip: vi.fn(),
  exportToGitHub: vi.fn(),
  getVersions: vi.fn(() => Promise.resolve([])),
  rollbackToVersion: vi.fn(),
  getTemplates: vi.fn(() => Promise.resolve([])),
  getGitHubStatus: vi.fn(() => Promise.resolve(null)),
  syncToGitHub: vi.fn(),
  InsufficientTokensError: class extends Error {},
}))

vi.mock('../api/sites', () => ({
  createSite: vi.fn(),
  getSiteDetail: vi.fn(),
}))

vi.mock('../api/settings', () => ({
  checkTokens: vi.fn(),
  getPricingPlans: vi.fn(() => Promise.resolve([])),
}))

vi.mock('../components/PlanSelectionDialog', () => ({
  default: () => <div data-testid="plan-dialog">PlanSelectionDialog</div>,
}))

vi.mock('../components/RefinementChat', () => ({
  default: () => <div data-testid="refinement-chat">RefinementChat</div>,
}))

vi.mock('../components/HeroSection', () => ({
  default: ({ onScrollToForm }: any) => <div data-testid="hero" onClick={onScrollToForm}>HeroSection</div>,
}))

vi.mock('../components/StatsSection', () => ({
  default: () => <div data-testid="stats">StatsSection</div>,
}))

vi.mock('../components/FeaturesSection', () => ({
  default: () => <div data-testid="features">FeaturesSection</div>,
}))

vi.mock('../components/PricingSection', () => ({
  default: () => <div data-testid="pricing">PricingSection</div>,
}))

vi.mock('../components/StepIndicator', () => ({
  default: () => <div data-testid="step-indicator">StepIndicator</div>,
}))

vi.mock('../components/LivePreview', () => ({
  default: () => <div data-testid="live-preview">LivePreview</div>,
}))

import HomePage from './HomePage'

beforeEach(() => { vi.clearAllMocks() })

describe('HomePage', () => {
  it('renders form view by default', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByText('form.label')).toBeInTheDocument()
  })

  it('renders hero section', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByTestId('hero')).toBeInTheDocument()
  })

  it('renders stats section', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByTestId('stats')).toBeInTheDocument()
  })

  it('renders features section', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByTestId('features')).toBeInTheDocument()
  })

  it('renders pricing section', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByTestId('pricing')).toBeInTheDocument()
  })

  it('renders submit button', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByText('form.submit')).toBeInTheDocument()
  })

  it('renders framework selection', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByText('framework.label')).toBeInTheDocument()
  })

  it('renders email input', async () => {
    await act(async () => {
      render(<HomePage />)
    })
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
  })
})
