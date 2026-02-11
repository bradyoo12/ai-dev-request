import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
    expect(screen.getByText('stats.poweredBy')).toBeInTheDocument()
  })
})
