import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return {
    useTranslation: () => ({ t }),
  }
})

vi.mock('../api/billing', () => ({
  getBillingOverview: vi.fn(),
  updateAutoTopUp: vi.fn(),
  getBillingAccount: vi.fn(),
  getUsageSummary: vi.fn(),
  getInvoices: vi.fn(),
  getPricingPlans: vi.fn(),
  subscribeToPlan: vi.fn(),
  cancelSubscription: vi.fn(),
  createPortalSession: vi.fn(),
}))

vi.mock('../api/settings', () => ({
  getTokenPackages: vi.fn(),
}))

import {
  getBillingOverview,
  getBillingAccount,
  getUsageSummary,
  getInvoices,
  getPricingPlans,
} from '../api/billing'
import { getTokenPackages } from '../api/settings'
import BillingPage from './BillingPage'

const defaultBillingOverview = {
  isSimulation: false,
  paymentMethods: [],
  autoTopUp: {
    isEnabled: false,
    threshold: 100,
    tokenPackageId: 1,
    monthlyLimitUsd: null,
    monthlySpentUsd: 0,
    lastTriggeredAt: null,
    lastFailedAt: null,
    failureReason: null,
  },
}

const defaultAccount = {
  id: 'acc-1',
  plan: 'free',
  status: 'active',
  requestsThisPeriod: 1,
  requestsLimit: 3,
  tokensUsedThisPeriod: 500,
  overageCharges: 0,
  monthlyRate: 0,
  perRequestOverageRate: 0,
  periodStart: '2026-02-01T00:00:00Z',
  periodEnd: '2026-03-01T00:00:00Z',
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: null,
}

const defaultUsage = {
  plan: 'free',
  status: 'active',
  requestsUsed: 1,
  requestsLimit: 3,
  tokensUsed: 500,
  overageCharges: 0,
  monthlyRate: 0,
  totalEstimated: 0,
  periodStart: '2026-02-01T00:00:00Z',
  periodEnd: '2026-03-01T00:00:00Z',
  daysRemaining: 18,
}

const defaultPlans = [
  { id: 'free', name: 'Free', monthlyRate: 0, requestsLimit: 3, perRequestOverageRate: 0, features: ['3 AI dev requests/month'] },
  { id: 'pro', name: 'Pro', monthlyRate: 29, requestsLimit: 20, perRequestOverageRate: 0.5, features: ['20 AI dev requests/month'] },
  { id: 'team', name: 'Team', monthlyRate: 99, requestsLimit: 100, perRequestOverageRate: 0.3, features: ['100 AI dev requests/month'] },
]

function setupMocks(overrides?: {
  billingOverview?: unknown
  account?: unknown
  usage?: unknown
  invoices?: unknown
  plans?: unknown
  packages?: unknown
}) {
  vi.mocked(getBillingOverview).mockResolvedValue((overrides?.billingOverview ?? defaultBillingOverview) as any)
  vi.mocked(getBillingAccount).mockResolvedValue((overrides?.account ?? defaultAccount) as any)
  vi.mocked(getUsageSummary).mockResolvedValue((overrides?.usage ?? defaultUsage) as any)
  vi.mocked(getInvoices).mockResolvedValue((overrides?.invoices ?? []) as any)
  vi.mocked(getPricingPlans).mockResolvedValue((overrides?.plans ?? defaultPlans) as any)
  vi.mocked(getTokenPackages).mockResolvedValue((overrides?.packages ?? []) as any)
}

beforeEach(() => { vi.clearAllMocks() })

describe('BillingPage', () => {
  it('shows loading state', async () => {
    vi.mocked(getBillingOverview).mockReturnValue(new Promise(() => {}))
    vi.mocked(getTokenPackages).mockReturnValue(new Promise(() => {}))
    vi.mocked(getBillingAccount).mockReturnValue(new Promise(() => {}))
    vi.mocked(getUsageSummary).mockReturnValue(new Promise(() => {}))
    vi.mocked(getInvoices).mockReturnValue(new Promise(() => {}))
    vi.mocked(getPricingPlans).mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('billing.loading')).toBeInTheDocument()
  })

  it('shows error on failure', async () => {
    vi.mocked(getBillingOverview).mockRejectedValue(new Error('fail'))
    vi.mocked(getTokenPackages).mockRejectedValue(new Error('fail'))
    vi.mocked(getBillingAccount).mockRejectedValue(new Error('fail'))
    vi.mocked(getUsageSummary).mockRejectedValue(new Error('fail'))
    vi.mocked(getInvoices).mockRejectedValue(new Error('fail'))
    vi.mocked(getPricingPlans).mockRejectedValue(new Error('fail'))
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('api.error.billingFailed')).toBeInTheDocument()
  })

  it('renders current plan card', async () => {
    setupMocks()
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getAllByText('Current Plan').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('free')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders usage meters', async () => {
    setupMocks()
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('Usage This Period')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('renders plan comparison cards', async () => {
    setupMocks()
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('Plans')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getAllByText('Current Plan').length).toBeGreaterThanOrEqual(1)
  })

  it('renders overage charges when present', async () => {
    setupMocks({
      usage: { ...defaultUsage, overageCharges: 2.50, totalEstimated: 31.50 },
    })
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('Overage Charges')).toBeInTheDocument()
    expect(screen.getByText('$2.50')).toBeInTheDocument()
  })

  it('renders invoice history when present', async () => {
    setupMocks({
      invoices: [
        { id: 'inv-1', date: '2026-02-01T00:00:00Z', amount: 29, status: 'paid', description: 'Pro plan subscription', planName: 'Pro' },
      ],
    })
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('Invoice History')).toBeInTheDocument()
    expect(screen.getByText('Pro plan subscription')).toBeInTheDocument()
    expect(screen.getByText('paid')).toBeInTheDocument()
  })

  it('shows simulation notice', async () => {
    setupMocks({
      billingOverview: { ...defaultBillingOverview, isSimulation: true },
    })
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('billing.simulationNotice')).toBeInTheDocument()
  })

  it('shows manage/cancel buttons for paid active plan', async () => {
    setupMocks({
      account: { ...defaultAccount, plan: 'pro', status: 'active', monthlyRate: 29 },
    })
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('Manage Subscription')).toBeInTheDocument()
    expect(screen.getByText('Cancel Subscription')).toBeInTheDocument()
  })

  it('does not show cancel button for free plan', async () => {
    setupMocks()
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument()
  })
})
