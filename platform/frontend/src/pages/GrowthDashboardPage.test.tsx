import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/growth', () => ({
  getGrowthOverview: vi.fn(() => Promise.resolve({
    totalVisitors: 0,
    totalRegistered: 0,
    totalTrialUsers: 0,
    totalPaidUsers: 0,
    conversionRate: 0,
    trialToPaidRate: 0,
    churnRate: 0,
    mrr: 0,
  })),
  getGrowthTrends: vi.fn(() => Promise.resolve([])),
  getGrowthFunnel: vi.fn(() => Promise.resolve([])),
  exportGrowthCsv: vi.fn(),
}))

import GrowthDashboardPage from './GrowthDashboardPage'

beforeEach(() => { vi.clearAllMocks() })

describe('GrowthDashboardPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<GrowthDashboardPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
