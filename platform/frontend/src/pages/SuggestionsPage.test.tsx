import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
    setTokenBalance: vi.fn(),
  }),
}))

vi.mock('./SuggestionBoardPage', () => ({
  default: () => <div data-testid="suggestion-board">SuggestionBoardPage</div>,
}))

import SuggestionsPage from './SuggestionsPage'

describe('SuggestionsPage', () => {
  it('renders heading', () => {
    render(<SuggestionsPage />)
    expect(screen.getByText('header.suggestions')).toBeInTheDocument()
  })

  it('renders SuggestionBoardPage', () => {
    render(<SuggestionsPage />)
    expect(screen.getByTestId('suggestion-board')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<SuggestionsPage />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
