import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('lucide-react', () => ({
  Sparkles: () => <span>Sparkles</span>,
}))

import FooterSection from './FooterSection'

describe('FooterSection', () => {
  it('renders brand name', () => {
    render(<MemoryRouter><FooterSection /></MemoryRouter>)
    expect(screen.getByText('AI Dev Request')).toBeInTheDocument()
  })

  it('renders footer sections', () => {
    render(<MemoryRouter><FooterSection /></MemoryRouter>)
    expect(screen.getByText('footer.services')).toBeInTheDocument()
    expect(screen.getByText('footer.support')).toBeInTheDocument()
  })

  it('renders copyright', () => {
    render(<MemoryRouter><FooterSection /></MemoryRouter>)
    expect(screen.getByText('footer.copyright')).toBeInTheDocument()
  })

  it('renders service links', () => {
    render(<MemoryRouter><FooterSection /></MemoryRouter>)
    expect(screen.getByText('footer.link.getStarted')).toBeInTheDocument()
    expect(screen.getByText('footer.link.pricing')).toBeInTheDocument()
  })
})
