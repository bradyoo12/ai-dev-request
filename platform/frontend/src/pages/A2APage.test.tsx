import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/a2a', () => ({
  getAgents: vi.fn(() => Promise.resolve([])),
  getConsents: vi.fn(() => Promise.resolve([])),
  registerAgent: vi.fn(),
  grantConsent: vi.fn(),
  revokeConsent: vi.fn(),
  getA2ATasks: vi.fn(() => Promise.resolve([])),
}))

import A2APage from './A2APage'

beforeEach(() => { vi.clearAllMocks() })

describe('A2APage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<A2APage />)
    })
    expect(document.body).toBeTruthy()
  })
})
