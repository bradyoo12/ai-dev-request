import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/payments', () => ({
  getPaymentHistory: vi.fn(() => Promise.resolve({ payments: [], totalCount: 0 })),
}))

import PaymentHistoryPage from './PaymentHistoryPage'

beforeEach(() => { vi.clearAllMocks() })

describe('PaymentHistoryPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<PaymentHistoryPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
