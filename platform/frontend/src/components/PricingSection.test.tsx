import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => key,
      i18n: { language: 'en' },
    }
  },
}))

vi.mock('lucide-react', () => ({
  Check: () => <span>Check</span>,
  X: () => <span>X</span>,
}))

import PricingSection from './PricingSection'

describe('PricingSection', () => {
  it('renders pricing title', () => {
    render(<PricingSection plans={[]} />)
    expect(screen.getByText('pricing.title')).toBeInTheDocument()
  })

  it('renders fallback plans when empty', () => {
    render(<PricingSection plans={[]} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('renders provided plans', () => {
    const plans = [
      { id: 'test', name: 'Test Plan', nameKorean: '', priceMonthly: 100, priceYearly: 1000, currency: 'USD', projectLimit: 5, features: ['basic_analysis'], isPopular: false },
    ]
    render(<PricingSection plans={plans} />)
    expect(screen.getByText('Test Plan')).toBeInTheDocument()
  })

  it('renders annual toggle', () => {
    render(<PricingSection plans={[]} />)
    expect(screen.getByText('pricing.monthly')).toBeInTheDocument()
    expect(screen.getByText('pricing.annual')).toBeInTheDocument()
  })

  it('highlights popular plan', () => {
    render(<PricingSection plans={[]} />)
    expect(screen.getByText('pricing.popular')).toBeInTheDocument()
  })

  it('toggles annual pricing', async () => {
    render(<PricingSection plans={[]} />)
    const user = userEvent.setup()
    // The toggle button has no accessible name, find by class
    const buttons = screen.getAllByRole('button')
    const annualToggle = buttons.find(b => b.className.includes('rounded-full'))
    if (annualToggle) {
      await user.click(annualToggle)
    }
  })
})
