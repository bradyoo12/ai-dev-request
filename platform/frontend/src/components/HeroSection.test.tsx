import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  return {
    motion: new Proxy({}, {
      get: (_target: unknown, prop: string) => React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
        const { children, whileHover, whileTap, whileInView, viewport, initial, animate, transition, variants, custom, ...rest } = props
        void whileHover; void whileTap; void whileInView; void viewport; void initial; void animate; void transition; void variants; void custom
        return React.createElement(prop, { ...rest, ref }, children)
      }),
    }),
    AnimatePresence: ({ children }: { children: unknown }) => children,
  }
})

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
