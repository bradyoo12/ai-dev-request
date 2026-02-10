import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import HeroSection from './HeroSection'

describe('HeroSection', () => {
  it('renders hero title', () => {
    render(<HeroSection onScrollToForm={() => {}} />)
    expect(screen.getByText('hero.title')).toBeInTheDocument()
  })

  it('renders hero subtitle', () => {
    render(<HeroSection onScrollToForm={() => {}} />)
    expect(screen.getByText('hero.subtitle')).toBeInTheDocument()
  })

  it('renders CTA buttons', () => {
    render(<HeroSection onScrollToForm={() => {}} />)
    expect(screen.getByText('hero.cta.start')).toBeInTheDocument()
    expect(screen.getByText('hero.cta.demo')).toBeInTheDocument()
  })

  it('calls onScrollToForm when CTA clicked', async () => {
    const mockScroll = vi.fn()
    render(<HeroSection onScrollToForm={mockScroll} />)
    const user = userEvent.setup()
    await user.click(screen.getByText('hero.cta.start'))
    expect(mockScroll).toHaveBeenCalled()
  })
})
