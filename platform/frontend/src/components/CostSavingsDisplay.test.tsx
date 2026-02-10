import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockGetCostReport = vi.fn()

vi.mock('../api/requests', () => ({
  getCostReport: (...args: unknown[]) => mockGetCostReport(...args),
}))

import CostSavingsDisplay from './CostSavingsDisplay'

const sampleCostReport = {
  totalEstimatedCost: 0.0523,
  estimatedSavingsVsOpusOnly: 0.2977,
  tierBreakdown: [
    {
      tier: 'haiku',
      category: 'Planning',
      inputTokens: 1000,
      outputTokens: 500,
      estimatedCost: 0.0023,
    },
    {
      tier: 'sonnet',
      category: 'Code Generation',
      inputTokens: 5000,
      outputTokens: 3000,
      estimatedCost: 0.03,
    },
    {
      tier: 'opus',
      category: 'Architecture Review',
      inputTokens: 2000,
      outputTokens: 1000,
      estimatedCost: 0.02,
    },
  ],
}

describe('CostSavingsDisplay', () => {
  beforeEach(() => {
    mockGetCostReport.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetCostReport.mockReturnValue(new Promise(() => {})) // never resolves
    render(<CostSavingsDisplay requestId="test-123" />)
    expect(screen.getByTestId('cost-savings-loading')).toBeInTheDocument()
    expect(screen.getByText('cost.loading')).toBeInTheDocument()
  })

  it('renders cost data after loading', async () => {
    mockGetCostReport.mockResolvedValue(sampleCostReport)
    render(<CostSavingsDisplay requestId="test-123" />)

    await waitFor(() => {
      expect(screen.getByTestId('cost-savings-display')).toBeInTheDocument()
    })

    expect(screen.getByText('cost.title')).toBeInTheDocument()
    expect(screen.getByTestId('cost-total')).toHaveTextContent('$0.0523')
    expect(screen.getByTestId('cost-savings')).toHaveTextContent('$0.2977')
  })

  it('renders nothing when API returns null', async () => {
    mockGetCostReport.mockResolvedValue(null)
    const { container } = render(<CostSavingsDisplay requestId="test-123" />)

    await waitFor(() => {
      expect(screen.queryByTestId('cost-savings-loading')).not.toBeInTheDocument()
    })

    expect(screen.queryByTestId('cost-savings-display')).not.toBeInTheDocument()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when API call fails', async () => {
    mockGetCostReport.mockRejectedValue(new Error('API error'))
    const { container } = render(<CostSavingsDisplay requestId="test-123" />)

    await waitFor(() => {
      expect(screen.queryByTestId('cost-savings-loading')).not.toBeInTheDocument()
    })

    expect(container.innerHTML).toBe('')
  })

  it('displays savings percentage bar', async () => {
    mockGetCostReport.mockResolvedValue(sampleCostReport)
    render(<CostSavingsDisplay requestId="test-123" />)

    await waitFor(() => {
      expect(screen.getByTestId('cost-savings-bar')).toBeInTheDocument()
    })

    // Savings percentage: 0.2977 / (0.0523 + 0.2977) = 0.2977 / 0.35 = ~85%
    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('displays tier breakdown entries', async () => {
    mockGetCostReport.mockResolvedValue(sampleCostReport)
    render(<CostSavingsDisplay requestId="test-123" />)

    await waitFor(() => {
      expect(screen.getByText('cost.tierBreakdown')).toBeInTheDocument()
    })

    expect(screen.getByText('cost.tier.haiku')).toBeInTheDocument()
    expect(screen.getByText('cost.tier.sonnet')).toBeInTheDocument()
    expect(screen.getByText('cost.tier.opus')).toBeInTheDocument()
    expect(screen.getByText('Planning')).toBeInTheDocument()
    expect(screen.getByText('Code Generation')).toBeInTheDocument()
    expect(screen.getByText('Architecture Review')).toBeInTheDocument()
  })

  it('does not show savings bar when savings percentage is 0', async () => {
    mockGetCostReport.mockResolvedValue({
      totalEstimatedCost: 0.5,
      estimatedSavingsVsOpusOnly: 0,
      tierBreakdown: [],
    })
    render(<CostSavingsDisplay requestId="test-123" />)

    await waitFor(() => {
      expect(screen.getByTestId('cost-savings-display')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('cost-savings-bar')).not.toBeInTheDocument()
  })

  it('calls getCostReport with the correct requestId', async () => {
    mockGetCostReport.mockResolvedValue(sampleCostReport)
    render(<CostSavingsDisplay requestId="my-request-456" />)

    await waitFor(() => {
      expect(mockGetCostReport).toHaveBeenCalledWith('my-request-456')
    })
  })
})
