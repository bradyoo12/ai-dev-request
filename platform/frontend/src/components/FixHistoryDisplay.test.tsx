import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import FixHistoryDisplay from './FixHistoryDisplay'

const sampleFixHistory = [
  {
    iteration: 1,
    issues: ['Missing import statement', 'Unused variable'],
    fixDescription: 'Added missing imports and removed unused variables',
  },
  {
    iteration: 2,
    issues: ['Type error in function parameter'],
    fixDescription: 'Fixed type annotation for function parameter',
  },
]

describe('FixHistoryDisplay', () => {
  it('renders nothing when fixHistory is undefined', () => {
    const { container } = render(
      <FixHistoryDisplay fixHistory={undefined} validationPassed={true} iterations={1} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when fixHistory is empty', () => {
    const { container } = render(
      <FixHistoryDisplay fixHistory={[]} validationPassed={true} iterations={1} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the component with fix history data', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    expect(screen.getByTestId('fix-history-display')).toBeInTheDocument()
  })

  it('shows fix history title', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    expect(screen.getByText('validation.fixHistory')).toBeInTheDocument()
  })

  it('shows iteration count', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    expect(screen.getByText(/: 2/)).toBeInTheDocument()
  })

  it('shows passed badge when validation passed', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    const badge = screen.getByTestId('validation-badge')
    expect(badge).toHaveTextContent('validation.passed')
  })

  it('shows max retries badge when validation failed', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={false} iterations={3} />
    )
    const badge = screen.getByTestId('validation-badge')
    expect(badge).toHaveTextContent('validation.maxRetries')
  })

  it('renders toggle buttons for each fix history entry', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    expect(screen.getByTestId('fix-history-toggle-1')).toBeInTheDocument()
    expect(screen.getByTestId('fix-history-toggle-2')).toBeInTheDocument()
  })

  it('expands fix history entry on click', async () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    const user = userEvent.setup()
    await user.click(screen.getByTestId('fix-history-toggle-1'))
    expect(screen.getByTestId('fix-history-content-1')).toBeInTheDocument()
    expect(screen.getByText('Missing import statement')).toBeInTheDocument()
    expect(screen.getByText('Unused variable')).toBeInTheDocument()
    expect(screen.getByText('Added missing imports and removed unused variables')).toBeInTheDocument()
  })

  it('collapses expanded entry on second click', async () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    const user = userEvent.setup()
    await user.click(screen.getByTestId('fix-history-toggle-1'))
    expect(screen.getByTestId('fix-history-content-1')).toBeInTheDocument()
    await user.click(screen.getByTestId('fix-history-toggle-1'))
    expect(screen.queryByTestId('fix-history-content-1')).not.toBeInTheDocument()
  })

  it('shows issue count for each entry', () => {
    render(
      <FixHistoryDisplay fixHistory={sampleFixHistory} validationPassed={true} iterations={2} />
    )
    // Entry 1 has 2 issues, entry 2 has 1 issue
    const toggles = screen.getAllByText(/validation.issuesFound/)
    expect(toggles.length).toBeGreaterThanOrEqual(2)
  })
})
