import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, optsOrFallback?: string | Record<string, unknown>) => {
      if (typeof optsOrFallback === 'object' && optsOrFallback !== null && 'multiplier' in optsOrFallback) {
        return `${optsOrFallback.multiplier}x cost`
      }
      if (typeof optsOrFallback === 'string') return optsOrFallback
      return key
    },
  }),
}))

import DynamicIntelligencePage from './DynamicIntelligencePage'

describe('DynamicIntelligencePage', () => {
  it('renders settings title and description', () => {
    render(<DynamicIntelligencePage />)
    expect(screen.getByText('dynamicIntelligence.settings.title')).toBeInTheDocument()
    expect(screen.getByText('dynamicIntelligence.settings.description')).toBeInTheDocument()
  })

  it('renders default power level section', () => {
    render(<DynamicIntelligencePage />)
    expect(screen.getByText('dynamicIntelligence.defaultLevel')).toBeInTheDocument()
  })

  it('renders all three power level options in settings', () => {
    render(<DynamicIntelligencePage />)
    expect(screen.getByTestId('settings-power-level-standard')).toBeInTheDocument()
    expect(screen.getByTestId('settings-power-level-extended')).toBeInTheDocument()
    expect(screen.getByTestId('settings-power-level-high_power')).toBeInTheDocument()
  })

  it('renders show reasoning toggle', () => {
    render(<DynamicIntelligencePage />)
    expect(screen.getByText('dynamicIntelligence.showReasoning')).toBeInTheDocument()
    expect(screen.getByTestId('show-reasoning-toggle')).toBeInTheDocument()
  })

  it('toggles show reasoning switch', async () => {
    const user = userEvent.setup()
    render(<DynamicIntelligencePage />)
    const toggle = screen.getByTestId('show-reasoning-toggle')
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('renders cost comparison table', () => {
    render(<DynamicIntelligencePage />)
    expect(screen.getByText('Cost Comparison')).toBeInTheDocument()
    expect(screen.getByText('Claude Sonnet')).toBeInTheDocument()
    expect(screen.getByText('Claude Sonnet + Extended Thinking')).toBeInTheDocument()
    expect(screen.getByText('Claude Opus')).toBeInTheDocument()
  })

  it('allows changing the default power level', async () => {
    const user = userEvent.setup()
    render(<DynamicIntelligencePage />)

    const standardBtn = screen.getByTestId('settings-power-level-standard')
    const extendedBtn = screen.getByTestId('settings-power-level-extended')

    expect(standardBtn).toHaveAttribute('aria-pressed', 'true')
    expect(extendedBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(extendedBtn)
    expect(extendedBtn).toHaveAttribute('aria-pressed', 'true')
    expect(standardBtn).toHaveAttribute('aria-pressed', 'false')
  })
})
