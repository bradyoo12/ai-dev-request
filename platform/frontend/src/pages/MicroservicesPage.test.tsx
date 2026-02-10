import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    authUser: { id: '1', email: 'test@test.com', displayName: 'Test', isAdmin: false },
  }),
}))

vi.mock('../api/microservices', () => ({
  getBlueprints: vi.fn(() => Promise.resolve([])),
  getBlueprint: vi.fn(),
  deleteBlueprint: vi.fn(),
}))

import MicroservicesPage from './MicroservicesPage'

beforeEach(() => { vi.clearAllMocks() })

describe('MicroservicesPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<MicroservicesPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
