import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../api/suggestions', () => ({
  getSuggestion: vi.fn(() => Promise.resolve({ id: 1, title: 'Test', status: 'pending', category: 'feature', description: 'Test', upvoteCount: 0, voted: false, createdAt: '2024-01-01' })),
  getSuggestionComments: vi.fn(() => Promise.resolve([])),
  getSuggestionHistory: vi.fn(() => Promise.resolve([])),
  addSuggestionComment: vi.fn(),
  voteSuggestion: vi.fn(),
}))

import SuggestionDetailPage from './SuggestionDetailPage'

beforeEach(() => { vi.clearAllMocks() })

describe('SuggestionDetailPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<SuggestionDetailPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
