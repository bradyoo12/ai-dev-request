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

vi.mock('../api/trends', () => ({
  getTrendReports: vi.fn(() => Promise.resolve([])),
  getUserReviews: vi.fn(() => Promise.resolve([])),
  getRecommendations: vi.fn(() => Promise.resolve([])),
  updateRecommendationStatus: vi.fn(),
}))

import ProjectHealthPage from './ProjectHealthPage'

beforeEach(() => { vi.clearAllMocks() })

describe('ProjectHealthPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<ProjectHealthPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
