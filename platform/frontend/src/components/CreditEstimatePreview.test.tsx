import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
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

import CreditEstimatePreview from './CreditEstimatePreview'

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

describe('CreditEstimatePreview', () => {
  beforeEach(() => {
    mockGetTokenOverview.mockReset()
    mockTokenBalance.mockReturnValue(500)
  })

  it('renders nothing while loading', () => {
    mockGetTokenOverview.mockReturnValue(new Promise(() => {})) // never resolves
    const { container } = render(<CreditEstimatePreview />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when tokenBalance is null', async () => {
    mockTokenBalance.mockReturnValue(null)
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    const { container } = render(<CreditEstimatePreview />)
    await waitFor(() => {
      expect(mockGetTokenOverview).toHaveBeenCalled()
    })
    expect(container.innerHTML).toBe('')
  })

  it('renders preview card after loading', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(<CreditEstimatePreview />)

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.preview.title')).toBeInTheDocument()
    })

    expect(screen.getByText('creditEstimate.currentBalance:')).toBeInTheDocument()
    expect(screen.getByText('creditEstimate.preview.totalEstimate:')).toBeInTheDocument()
    expect(screen.getByText('creditEstimate.estimatedRemaining:')).toBeInTheDocument()
  })

  it('displays step cost breakdown', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(<CreditEstimatePreview />)

    await waitFor(() => {
      expect(screen.getByText(/creditEstimate\.step\.analysis/)).toBeInTheDocument()
    })

    expect(screen.getByText(/creditEstimate\.step\.proposal/)).toBeInTheDocument()
    expect(screen.getByText(/creditEstimate\.step\.build/)).toBeInTheDocument()
  })

  it('shows insufficient hint when balance is too low', async () => {
    mockTokenBalance.mockReturnValue(50) // Very low balance
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(<CreditEstimatePreview />)

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.preview.insufficientHint')).toBeInTheDocument()
    })

    // Should also show buy tokens button
    expect(screen.getByText('settings.tokens.buyTokens')).toBeInTheDocument()
  })

  it('does not show insufficient hint when balance is sufficient', async () => {
    mockTokenBalance.mockReturnValue(1000) // Plenty
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(<CreditEstimatePreview />)

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.preview.title')).toBeInTheDocument()
    })

    expect(screen.queryByText('creditEstimate.preview.insufficientHint')).not.toBeInTheDocument()
  })

  it('shows disclaimer note', async () => {
    mockGetTokenOverview.mockResolvedValue(sampleOverview)
    render(<CreditEstimatePreview />)

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.preview.note')).toBeInTheDocument()
    })
  })

  it('renders gracefully when API fails', async () => {
    mockGetTokenOverview.mockRejectedValue(new Error('Network error'))
    render(<CreditEstimatePreview />)

    await waitFor(() => {
      expect(screen.getByText('creditEstimate.preview.title')).toBeInTheDocument()
    })
  })
})
