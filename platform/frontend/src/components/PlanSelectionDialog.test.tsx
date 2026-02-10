import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../api/hosting', () => ({
  getHostingPlans: vi.fn(),
  getRecommendedPlan: vi.fn(),
}))

vi.mock('../api/settings', () => ({
  TOKEN_TO_USD_RATE: 0.01,
}))

import { getHostingPlans, getRecommendedPlan } from '../api/hosting'
import PlanSelectionDialog from './PlanSelectionDialog'

beforeEach(() => { vi.clearAllMocks() })

describe('PlanSelectionDialog', () => {
  const plans = [
    { id: 1, name: 'free', displayName: 'Free', monthlyCostUsd: 0, vcpu: 0.25, memoryGb: 0.5, supportsAutoscale: false, supportsCustomDomain: false, bestFor: 'Testing' },
    { id: 2, name: 'basic', displayName: 'Basic', monthlyCostUsd: 5, vcpu: 0.5, memoryGb: 1, supportsAutoscale: false, supportsCustomDomain: true, bestFor: 'Small apps' },
  ]

  it('shows loading state', async () => {
    vi.mocked(getHostingPlans).mockReturnValue(new Promise(() => {}))
    vi.mocked(getRecommendedPlan).mockReturnValue(new Promise(() => {}))
    await act(async () => {
      render(<PlanSelectionDialog complexity="simple" tokenCost={100} onSelect={() => {}} onCancel={() => {}} />)
    })
    expect(screen.getByText('hosting.loading')).toBeInTheDocument()
  })

  it('renders plans after loading', async () => {
    vi.mocked(getHostingPlans).mockResolvedValue(plans as any)
    vi.mocked(getRecommendedPlan).mockResolvedValue(plans[0] as any)
    await act(async () => {
      render(<PlanSelectionDialog complexity="simple" tokenCost={100} onSelect={() => {}} onCancel={() => {}} />)
    })
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Basic')).toBeInTheDocument()
  })

  it('shows error on failure', async () => {
    vi.mocked(getHostingPlans).mockRejectedValue(new Error('fail'))
    vi.mocked(getRecommendedPlan).mockRejectedValue(new Error('fail'))
    await act(async () => {
      render(<PlanSelectionDialog complexity="simple" tokenCost={100} onSelect={() => {}} onCancel={() => {}} />)
    })
    expect(screen.getByText('error.requestFailed')).toBeInTheDocument()
  })

  it('calls onCancel', async () => {
    vi.mocked(getHostingPlans).mockRejectedValue(new Error('fail'))
    vi.mocked(getRecommendedPlan).mockRejectedValue(new Error('fail'))
    const mockCancel = vi.fn()
    await act(async () => {
      render(<PlanSelectionDialog complexity="simple" tokenCost={100} onSelect={() => {}} onCancel={mockCancel} />)
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('common.close'))
    expect(mockCancel).toHaveBeenCalled()
  })

  it('calls onSelect with plan id', async () => {
    vi.mocked(getHostingPlans).mockResolvedValue(plans as any)
    vi.mocked(getRecommendedPlan).mockResolvedValue(plans[0] as any)
    const mockSelect = vi.fn()
    await act(async () => {
      render(<PlanSelectionDialog complexity="simple" tokenCost={100} onSelect={mockSelect} onCancel={() => {}} />)
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('hosting.buildAndDeploy'))
    expect(mockSelect).toHaveBeenCalledWith(1)
  })
})
