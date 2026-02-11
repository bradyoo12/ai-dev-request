import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockNavigate = vi.fn()
const mockSearchParams = new URLSearchParams()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
  useLocation: () => ({ pathname: '/settings', search: '', hash: '', state: null, key: 'default' }),
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

vi.mock('./GenerationManifestPage', () => ({
  default: () => <div data-testid="generation-manifest-page">GenerationManifestPage</div>,
}))

vi.mock('./OAuthCompliancePage', () => ({
  default: () => <div data-testid="oauth-compliance-page">OAuthCompliancePage</div>,
}))

vi.mock('./CompilerValidationPage', () => ({
  default: () => <div data-testid="compiler-validation-page">CompilerValidationPage</div>,
}))

vi.mock('./ObservabilityPage', () => ({
  default: () => <div data-testid="observability-page">ObservabilityPage</div>,
}))

vi.mock('./WorkflowPage', () => ({
  default: () => <div data-testid="workflow-page">WorkflowPage</div>,
}))

vi.mock('./SpecificationPage', () => ({
  default: () => <div data-testid="specification-page">SpecificationPage</div>,
}))

vi.mock('./GitHubSyncPage', () => ({
  default: () => <div data-testid="github-sync-page">GitHubSyncPage</div>,
}))

vi.mock('./CodeReviewPage', () => ({
  default: () => <div data-testid="code-review-page">CodeReviewPage</div>,
}))

vi.mock('./StreamingGenerationPage', () => ({
  default: () => <div data-testid="streaming-generation-page">StreamingGenerationPage</div>,
}))

vi.mock('./McpIntegrationPage', () => ({
  default: () => <div data-testid="mcp-integration-page">McpIntegrationPage</div>,
}))

vi.mock('./AnalyticsDashboardPage', () => ({
  default: () => <div data-testid="analytics-dashboard-page">AnalyticsDashboardPage</div>,
}))

vi.mock('./MarketplacePage', () => ({
  default: () => <div data-testid="marketplace-page">MarketplacePage</div>,
}))

vi.mock('./ContainerizationPage', () => ({
  default: () => <div data-testid="containerization-page">ContainerizationPage</div>,
}))

vi.mock('./TestGenerationPage', () => ({
  default: () => <div data-testid="test-generation-page">TestGenerationPage</div>,
}))

vi.mock('./CollaborativeEditingPage', () => ({
  default: () => <div data-testid="collaborative-editing-page">CollaborativeEditingPage</div>,
}))

vi.mock('./OnboardingPage', () => ({
  default: () => <div data-testid="onboarding-page">OnboardingPage</div>,
}))

vi.mock('./ProjectVersionPage', () => ({
  default: () => <div data-testid="project-version-page">ProjectVersionPage</div>,
}))

vi.mock('./ComponentPreviewPage', () => ({
  default: () => <div data-testid="component-preview-page">ComponentPreviewPage</div>,
}))

vi.mock('./VariantComparisonPage', () => ({
  default: () => <div data-testid="variant-comparison-page">VariantComparisonPage</div>,
}))

vi.mock('./PerformanceProfilePage', () => ({
  default: () => <div data-testid="performance-profile-page">PerformanceProfilePage</div>,
}))

vi.mock('./SchemaDesignerPage', () => ({
  default: () => <div data-testid="schema-designer-page">SchemaDesignerPage</div>,
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
