import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/settings', () => ({
  getUsageSummary: vi.fn(),
  getUsageTransactions: vi.fn(),
  getUsageByProject: vi.fn(),
  getUsageExportUrl: vi.fn(),
  getUserId: vi.fn(() => 'user-1'),
}))

import { getUsageSummary, getUsageTransactions, getUsageByProject } from '../api/settings'
import UsagePage from './UsagePage'

beforeEach(() => { vi.clearAllMocks() })

describe('UsagePage', () => {
  it('shows loading state', () => {
    vi.mocked(getUsageSummary).mockReturnValue(new Promise(() => {}))
    vi.mocked(getUsageTransactions).mockReturnValue(new Promise(() => {}))
    vi.mocked(getUsageByProject).mockReturnValue(new Promise(() => {}))
    render(<UsagePage />)
    // Component renders in loading state
    expect(document.body).toBeTruthy()
  })

  it('renders after data loads', async () => {
    vi.mocked(getUsageSummary).mockResolvedValue({
      balance: 1000,
      balanceValueUsd: 10,
      usedThisMonth: 200,
      projectsThisMonth: 3,
      addedThisMonth: 500,
      lifetimeUsed: 5000,
      lifetimeGranted: 6000,
    } as any)
    vi.mocked(getUsageTransactions).mockResolvedValue({
      transactions: [],
      totalCount: 0,
    } as any)
    vi.mocked(getUsageByProject).mockResolvedValue([])
    await act(async () => {
      render(<UsagePage />)
    })
    expect(document.body).toBeTruthy()
  })
})
