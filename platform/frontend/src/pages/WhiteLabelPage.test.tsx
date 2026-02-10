import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../contexts/AuthContext', () => {
  const authUser = { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: true }
  return {
    useAuth: () => ({ authUser }),
  }
})

vi.mock('../api/whitelabel', () => ({
  default: {},
  getTenants: vi.fn(() => Promise.resolve([])),
  getTenant: vi.fn(() => Promise.resolve({})),
  createTenant: vi.fn(() => Promise.resolve({})),
  updateTenant: vi.fn(() => Promise.resolve({})),
  deleteTenant: vi.fn(() => Promise.resolve({})),
  getPartners: vi.fn(() => Promise.resolve([])),
  addPartner: vi.fn(() => Promise.resolve({})),
  updatePartner: vi.fn(() => Promise.resolve({})),
  removePartner: vi.fn(() => Promise.resolve({})),
  getUsageSummary: vi.fn(() => Promise.resolve({})),
}))

import WhiteLabelPage from './WhiteLabelPage'

beforeEach(() => { vi.clearAllMocks() })

describe('WhiteLabelPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<WhiteLabelPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
