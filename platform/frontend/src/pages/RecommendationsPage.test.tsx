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

vi.mock('../api/recommendations', () => ({
  getRecommendations: vi.fn(() => Promise.resolve([])),
  refreshRecommendations: vi.fn(),
  dismissRecommendation: vi.fn(),
  getInterests: vi.fn(() => Promise.resolve([])),
  addInterest: vi.fn(),
  deleteInterest: vi.fn(),
}))

import RecommendationsPage from './RecommendationsPage'

beforeEach(() => { vi.clearAllMocks() })

describe('RecommendationsPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<RecommendationsPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
