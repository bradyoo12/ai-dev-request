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
