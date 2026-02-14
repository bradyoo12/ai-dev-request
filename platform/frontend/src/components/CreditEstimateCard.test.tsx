import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockTokenBalance = vi.fn(() => 500)
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    tokenBalance: mockTokenBalance(),
  }),
}))

const mockGetTokenOverview = vi.fn()
vi.mock('../api/settings', () => ({
  getTokenOverview: (...args: unknown[]) => mockGetTokenOverview(...args),
}))

import CreditEstimateCard from './CreditEstimateCard'

const sampleOverview = {
  balance: 500,
  totalEarned: 1000,
  totalSpent: 500,
  balanceValueUsd: 5.0,
  pricing: [
    { actionType: 'analysis', tokenCost: 50, description: 'AI Analysis', approxUsd: 0.5 },
    { actionType: 'proposal', tokenCost: 100, description: 'Proposal Generation', approxUsd: 1.0 },
    { actionType: 'build', tokenCost: 300, description: 'Project Build', approxUsd: 3.0 },
  ],
}

describe('CreditEstimateCard', () => {
  beforeEach(() => {
    mockGetTokenOverview.mockReset()
    mockTokenBalance.mockReturnValue(500)
  })

  it('renders nothing while loading', () => {
    mockGetTokenOverview.mockReturnValue(new Promise(() => {})) // never resolves
    const { container } = render(
      <CreditEstimateCard complexity="medium" completedSteps={['analysis']} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when tokenBalance is null', async () => {
    mockTokenBalance.mockReturnValue(null)
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    const { container } = render(
      <CreditEstimateCard complexity="medium" completedSteps={['analysis']} />
    )
    // Even after loading completes, should not render since tokenBalance is null
    await waitFor(() => {
      expect(mockGetTokenOverview).toHaveBeenCalled()
    })
    expect(container.innerHTML).toBe('')
  })

  it('renders credit estimate card after loading', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(
      <CreditEstimateCard complexity="simple" completedSteps={['analysis']} />
    )

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.title')).toBeInTheDocument()
    })

    // Should display current balance
    expect(screen.getByText('creditEstimate.currentBalance')).toBeInTheDocument()
    // Should display estimated usage
    expect(screen.getByText('creditEstimate.estimatedUsage')).toBeInTheDocument()
    // Should display estimated remaining
    expect(screen.getByText('creditEstimate.estimatedRemaining')).toBeInTheDocument()
  })

  it('displays step-by-step breakdown', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(
      <CreditEstimateCard complexity="simple" completedSteps={['analysis']} />
    )

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.breakdown')).toBeInTheDocument()
    })

    expect(screen.getByText('creditEstimate.step.analysis')).toBeInTheDocument()
    expect(screen.getByText('creditEstimate.step.proposal')).toBeInTheDocument()
    expect(screen.getByText('creditEstimate.step.build')).toBeInTheDocument()
  })

  it('shows insufficient warning when balance is low', async () => {
    mockTokenBalance.mockReturnValue(50) // Very low balance
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(
      <CreditEstimateCard complexity="simple" completedSteps={[]} />
    )

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.insufficientWarning')).toBeInTheDocument()
    })
  })

  it('does not show insufficient warning when balance is sufficient', async () => {
    mockTokenBalance.mockReturnValue(1000) // Plenty of balance
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(
      <CreditEstimateCard complexity="simple" completedSteps={['analysis']} />
    )

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.title')).toBeInTheDocument()
    })

    expect(screen.queryByText('creditEstimate.insufficientWarning')).not.toBeInTheDocument()
  })

  it('uses actual tokens used when provided', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(
      <CreditEstimateCard
        complexity="simple"
        analysisTokensUsed={75}
        completedSteps={['analysis']}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.title')).toBeInTheDocument()
    })

    // The analysis step should show the actual tokens used (75) instead of estimated (50)
    // Total estimated usage should be 75 (analysis actual) + 100 (proposal) + 300 (build) = 475
    const usageEl = screen.getAllByText(/75/)
    expect(usageEl.length).toBeGreaterThanOrEqual(1)
  })

  it('shows disclaimer text', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(
      <CreditEstimateCard complexity="simple" completedSteps={['analysis']} />
    )

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.disclaimer')).toBeInTheDocument()
    })
  })

  it('renders gracefully when API fails', async () => {
    mockGetTokenOverview.mockRejectedValue(new Error('Network error'))
    render(
      <CreditEstimateCard complexity="simple" completedSteps={['analysis']} />
    )

    // After API failure, component should render with fallback (0 costs from pricing)
    await waitFor(() => {
      expect(screen.getByText('creditEstimate.title')).toBeInTheDocument()
    })
  })
})
