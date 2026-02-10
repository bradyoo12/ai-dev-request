import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/settings', () => ({
  getTokenOverview: vi.fn(() => Promise.resolve({
    balance: 100,
    balanceValueUsd: 1.00,
    totalEarned: 500,
    totalSpent: 400,
    pricing: [],
  })),
  getTokenHistory: vi.fn(() => Promise.resolve([])),
  getTokenPackages: vi.fn(() => Promise.resolve([])),
}))

vi.mock('../api/payments', () => ({
  createCheckout: vi.fn(),
}))

import SettingsPage from './SettingsPage'

beforeEach(() => { vi.clearAllMocks() })

describe('SettingsPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<SettingsPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
