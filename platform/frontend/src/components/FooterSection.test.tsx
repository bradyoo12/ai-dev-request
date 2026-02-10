import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import FooterSection from './FooterSection'

describe('FooterSection', () => {
  it('renders brand name', () => {
    render(<FooterSection />)
    expect(screen.getByText('AI Dev Request')).toBeInTheDocument()
  })

  it('renders footer sections', () => {
    render(<FooterSection />)
    expect(screen.getByText('footer.services')).toBeInTheDocument()
    expect(screen.getByText('footer.support')).toBeInTheDocument()
    expect(screen.getByText('footer.newsletter')).toBeInTheDocument()
  })

  it('renders copyright', () => {
    render(<FooterSection />)
    expect(screen.getByText('footer.copyright')).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<FooterSection />)
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
  })

  it('renders subscribe button', () => {
    render(<FooterSection />)
    expect(screen.getByText('footer.subscribe')).toBeInTheDocument()
  })
})
