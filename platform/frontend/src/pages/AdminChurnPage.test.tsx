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

vi.mock('./admin/ChurnDashboard', () => ({
  default: () => <div data-testid="churn-dashboard">ChurnDashboard</div>,
}))

import AdminChurnPage from './AdminChurnPage'

describe('AdminChurnPage', () => {
  it('renders churn dashboard', () => {
    render(<AdminChurnPage />)
    expect(screen.getByTestId('churn-dashboard')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<AdminChurnPage />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
