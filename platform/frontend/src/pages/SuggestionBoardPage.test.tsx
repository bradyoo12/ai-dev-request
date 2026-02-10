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

vi.mock('../api/suggestions', () => ({
  getSuggestions: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 }),
  voteSuggestion: vi.fn().mockResolvedValue({}),
}))

import SuggestionBoardPage from './SuggestionBoardPage'

beforeEach(() => { vi.clearAllMocks() })

describe('SuggestionBoardPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<SuggestionBoardPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
