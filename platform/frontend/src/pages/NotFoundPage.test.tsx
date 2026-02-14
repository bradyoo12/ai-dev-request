import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/nonexistent-page' }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import NotFoundPage from './NotFoundPage'

beforeEach(() => { vi.clearAllMocks() })

describe('NotFoundPage', () => {
  it('renders 404 heading', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders page title', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(screen.getByText('notFound.title')).toBeInTheDocument()
  })

  it('renders error message', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(screen.getByText('notFound.message')).toBeInTheDocument()
  })

  it('renders back to home button', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(screen.getByText('notFound.backHome')).toBeInTheDocument()
  })

  it('displays the attempted path', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(screen.getByText('/nonexistent-page')).toBeInTheDocument()
  })

  it('navigates home when button is clicked', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    const button = screen.getByText('notFound.backHome')
    await act(async () => {
      button.click()
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('sets document title', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(document.title).toContain('404')
  })

  it('has alert role for accessibility', async () => {
    await act(async () => {
      render(<NotFoundPage />)
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
