import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockNavigate = vi.fn()
const mockSearchParams = new URLSearchParams()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    setTokenBalance: vi.fn(),
  }),
}))

vi.mock('./SettingsPage', () => ({
  default: () => <div data-testid="settings-page">SettingsPage</div>,
}))

vi.mock('./UsagePage', () => ({
  default: () => <div data-testid="usage-page">UsagePage</div>,
}))

vi.mock('./BillingPage', () => ({
  default: () => <div data-testid="billing-page">BillingPage</div>,
}))

vi.mock('./PaymentHistoryPage', () => ({
  default: () => <div data-testid="payment-page">PaymentHistoryPage</div>,
}))

vi.mock('./MemoryPage', () => ({
  default: () => <div data-testid="memory-page">MemoryPage</div>,
}))

vi.mock('./PreferencePage', () => ({
  default: () => <div data-testid="preference-page">PreferencePage</div>,
}))

vi.mock('./InfrastructurePage', () => ({
  default: () => <div data-testid="infrastructure-page">InfrastructurePage</div>,
}))

vi.mock('./SecretDetectionPage', () => ({
  default: () => <div data-testid="secret-detection-page">SecretDetectionPage</div>,
}))

vi.mock('./PreviewDeploymentPage', () => ({
  default: () => <div data-testid="preview-deployment-page">PreviewDeploymentPage</div>,
}))

import SettingsLayout from './SettingsLayout'

describe('SettingsLayout', () => {
  it('renders settings title', () => {
    render(<SettingsLayout />)
    expect(screen.getByText('settings.title')).toBeInTheDocument()
  })

  it('renders tab buttons', () => {
    render(<SettingsLayout />)
    expect(screen.getByText('settings.tabs.tokens')).toBeInTheDocument()
    expect(screen.getByText('settings.tabs.usage')).toBeInTheDocument()
    expect(screen.getByText('settings.tabs.billing')).toBeInTheDocument()
    expect(screen.getByText('settings.tabs.payments')).toBeInTheDocument()
    expect(screen.getByText('settings.tabs.memories')).toBeInTheDocument()
    expect(screen.getByText('settings.tabs.preferences')).toBeInTheDocument()
  })

  it('renders tokens tab by default', () => {
    render(<SettingsLayout />)
    expect(screen.getByTestId('settings-page')).toBeInTheDocument()
  })

  it('switches to usage tab', async () => {
    render(<SettingsLayout />)
    const user = userEvent.setup()
    await user.click(screen.getByText('settings.tabs.usage'))
    expect(screen.getByTestId('usage-page')).toBeInTheDocument()
  })

  it('switches to billing tab', async () => {
    render(<SettingsLayout />)
    const user = userEvent.setup()
    await user.click(screen.getByText('settings.tabs.billing'))
    expect(screen.getByTestId('billing-page')).toBeInTheDocument()
  })
})
