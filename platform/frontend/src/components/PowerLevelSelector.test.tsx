import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'multiplier' in opts) return `${opts.multiplier}x cost`
      return key
    },
  }),
}))

import PowerLevelSelector from './PowerLevelSelector'

describe('PowerLevelSelector', () => {
  it('renders all three power level options', () => {
    render(<PowerLevelSelector value="standard" onChange={() => {}} />)
    expect(screen.getByTestId('power-level-standard')).toBeInTheDocument()
    expect(screen.getByTestId('power-level-extended')).toBeInTheDocument()
    expect(screen.getByTestId('power-level-high_power')).toBeInTheDocument()
  })

  it('renders title and description', () => {
    render(<PowerLevelSelector value="standard" onChange={() => {}} />)
    expect(screen.getByText('dynamicIntelligence.title')).toBeInTheDocument()
    expect(screen.getByText('dynamicIntelligence.description')).toBeInTheDocument()
  })

  it('shows selected state for the active power level', () => {
    render(<PowerLevelSelector value="extended" onChange={() => {}} />)
    const extendedBtn = screen.getByTestId('power-level-extended')
    expect(extendedBtn).toHaveAttribute('aria-pressed', 'true')

    const standardBtn = screen.getByTestId('power-level-standard')
    expect(standardBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange when a different power level is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PowerLevelSelector value="standard" onChange={onChange} />)

    await user.click(screen.getByTestId('power-level-extended'))
    expect(onChange).toHaveBeenCalledWith('extended')

    await user.click(screen.getByTestId('power-level-high_power'))
    expect(onChange).toHaveBeenCalledWith('high_power')
  })

  it('disables buttons when disabled prop is true', () => {
    render(<PowerLevelSelector value="standard" onChange={() => {}} disabled />)
    expect(screen.getByTestId('power-level-standard')).toBeDisabled()
    expect(screen.getByTestId('power-level-extended')).toBeDisabled()
    expect(screen.getByTestId('power-level-high_power')).toBeDisabled()
  })

  it('renders cost multiplier badges', () => {
    render(<PowerLevelSelector value="standard" onChange={() => {}} />)
    expect(screen.getByText('1x cost')).toBeInTheDocument()
    expect(screen.getByText('2x cost')).toBeInTheDocument()
    expect(screen.getByText('5x cost')).toBeInTheDocument()
  })
})
