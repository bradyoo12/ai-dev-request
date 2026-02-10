import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return {
    useTranslation: () => ({ t }),
  }
})

vi.mock('../api/billing', () => ({
  getBillingOverview: vi.fn(),
  updateAutoTopUp: vi.fn(),
}))

vi.mock('../api/settings', () => ({
  getTokenPackages: vi.fn(),
}))

import { getBillingOverview } from '../api/billing'
import { getTokenPackages } from '../api/settings'
import BillingPage from './BillingPage'

beforeEach(() => { vi.clearAllMocks() })

describe('BillingPage', () => {
  it('shows loading state', async () => {
    vi.mocked(getBillingOverview).mockReturnValue(new Promise(() => {}))
    vi.mocked(getTokenPackages).mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('billing.loading')).toBeInTheDocument()
  })

  it('shows error on failure', async () => {
    vi.mocked(getBillingOverview).mockRejectedValue(new Error('fail'))
    vi.mocked(getTokenPackages).mockRejectedValue(new Error('fail'))
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('api.error.billingFailed')).toBeInTheDocument()
  })

  it('renders billing data', async () => {
    const billingData = {
      isSimulation: false,
      paymentMethods: [
        { id: 'pm1', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2025, isDefault: true },
      ],
      autoTopUp: {
        isEnabled: false,
        threshold: 100,
        tokenPackageId: 1,
        monthlyLimitUsd: null,
        monthlySpentUsd: 0,
        lastFailedAt: null,
        failureReason: null,
      },
    }
    vi.mocked(getBillingOverview).mockResolvedValue(billingData as any)
    vi.mocked(getTokenPackages).mockResolvedValue([
      { id: 1, name: 'Basic', tokenAmount: 100, priceUsd: 10 },
    ] as any)
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('billing.paymentMethods')).toBeInTheDocument()
    expect(screen.getByText(/4242/)).toBeInTheDocument()
  })

  it('shows simulation notice', async () => {
    const billingData = {
      isSimulation: true,
      paymentMethods: [],
      autoTopUp: {
        isEnabled: false,
        threshold: 100,
        tokenPackageId: 1,
        monthlyLimitUsd: null,
        monthlySpentUsd: 0,
        lastFailedAt: null,
        failureReason: null,
      },
    }
    vi.mocked(getBillingOverview).mockResolvedValue(billingData as any)
    vi.mocked(getTokenPackages).mockResolvedValue([])
    await act(async () => {
      render(<BillingPage />)
    })
    expect(screen.getByText('billing.simulationNotice')).toBeInTheDocument()
  })
})
