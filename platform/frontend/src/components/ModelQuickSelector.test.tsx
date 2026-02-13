import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ModelQuickSelector from './ModelQuickSelector'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ModelQuickSelector', () => {
  it('renders all three model options', () => {
    const onChange = vi.fn()
    render(<ModelQuickSelector value="claude:claude-sonnet-4-5-20250929" onChange={onChange} />)

    expect(screen.getByTestId('model-selector-haiku')).toBeInTheDocument()
    expect(screen.getByTestId('model-selector-sonnet')).toBeInTheDocument()
    expect(screen.getByTestId('model-selector-opus')).toBeInTheDocument()
  })

  it('marks the selected model as pressed', () => {
    const onChange = vi.fn()
    render(<ModelQuickSelector value="claude:claude-opus-4-6" onChange={onChange} />)

    const opusButton = screen.getByTestId('model-selector-opus')
    expect(opusButton).toHaveAttribute('aria-pressed', 'true')

    const sonnetButton = screen.getByTestId('model-selector-sonnet')
    expect(sonnetButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange when a model is clicked', () => {
    const onChange = vi.fn()
    render(<ModelQuickSelector value="claude:claude-sonnet-4-5-20250929" onChange={onChange} />)

    const haikuButton = screen.getByTestId('model-selector-haiku')
    fireEvent.click(haikuButton)

    expect(onChange).toHaveBeenCalledWith('claude:claude-haiku-4-5-20251001')
  })

  it('disables all buttons when disabled prop is true', () => {
    const onChange = vi.fn()
    render(<ModelQuickSelector value="claude:claude-sonnet-4-5-20250929" onChange={onChange} disabled />)

    expect(screen.getByTestId('model-selector-haiku')).toBeDisabled()
    expect(screen.getByTestId('model-selector-sonnet')).toBeDisabled()
    expect(screen.getByTestId('model-selector-opus')).toBeDisabled()
  })

  it('hides cost info when showCostInfo is false', () => {
    const onChange = vi.fn()
    render(<ModelQuickSelector value="claude:claude-sonnet-4-5-20250929" onChange={onChange} showCostInfo={false} />)

    expect(screen.queryByText(/modelSelector.cost/)).not.toBeInTheDocument()
  })

  it('renders in compact mode', () => {
    const onChange = vi.fn()
    const { container } = render(
      <ModelQuickSelector value="claude:claude-sonnet-4-5-20250929" onChange={onChange} compact />
    )

    // Check that grid has 3 columns in compact mode
    const grid = container.querySelector('.grid-cols-3')
    expect(grid).toBeInTheDocument()
  })
})
