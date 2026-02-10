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

vi.mock('./MySitesPage', () => ({
  default: () => <div data-testid="my-sites">MySitesPage</div>,
}))

import SitesPage from './SitesPage'

describe('SitesPage', () => {
  it('renders heading', () => {
    render(<SitesPage />)
    expect(screen.getByText('header.mySites')).toBeInTheDocument()
  })

  it('renders MySitesPage', () => {
    render(<SitesPage />)
    expect(screen.getByTestId('my-sites')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<SitesPage />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
