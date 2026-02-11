import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('lucide-react', () => ({
  FileText: () => <span>FileText</span>,
  Search: () => <span>Search</span>,
  Lightbulb: () => <span>Lightbulb</span>,
  Hammer: () => <span>Hammer</span>,
  Rocket: () => <span>Rocket</span>,
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

import FeaturesSection from './FeaturesSection'

describe('FeaturesSection', () => {
  it('renders heading', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('features.howItWorks')).toBeInTheDocument()
  })

  it('renders all five steps', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('steps.request.title')).toBeInTheDocument()
    expect(screen.getByText('steps.analysis.title')).toBeInTheDocument()
    expect(screen.getByText('steps.proposal.title')).toBeInTheDocument()
    expect(screen.getByText('steps.build.title')).toBeInTheDocument()
    expect(screen.getByText('steps.deploy.title')).toBeInTheDocument()
  })

  it('renders step descriptions', () => {
    render(<FeaturesSection />)
    expect(screen.getByText('steps.request.description')).toBeInTheDocument()
  })
})
