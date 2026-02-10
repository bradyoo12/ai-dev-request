import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import StatsSection from './StatsSection'

describe('StatsSection', () => {
  it('renders stat values', () => {
    render(<StatsSection />)
    expect(screen.getByText('150+')).toBeInTheDocument()
    expect(screen.getByText('50+')).toBeInTheDocument()
    expect(screen.getByText('< 5min')).toBeInTheDocument()
  })

  it('renders tech logos', () => {
    render(<StatsSection />)
    expect(screen.getByText('Claude AI')).toBeInTheDocument()
    expect(screen.getByText('Azure')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('.NET')).toBeInTheDocument()
  })

  it('renders powered by text', () => {
    render(<StatsSection />)
    expect(screen.getByText('Powered by')).toBeInTheDocument()
  })
})
