import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{{${k}}}`, String(v))
        }
        return result
      }
      return key
    },
  }),
}))

import ValidationProgress from './ValidationProgress'

describe('ValidationProgress', () => {
  it('renders the component', () => {
    render(
      <ValidationProgress iterations={0} maxIterations={3} currentPhase="validating" passed={false} />
    )
    expect(screen.getByTestId('validation-progress')).toBeInTheDocument()
  })

  it('shows validating phase text', () => {
    render(
      <ValidationProgress iterations={0} maxIterations={3} currentPhase="validating" passed={false} />
    )
    expect(screen.getByText('validation.validating')).toBeInTheDocument()
  })

  it('shows fixing phase text with iteration counts', () => {
    render(
      <ValidationProgress iterations={2} maxIterations={3} currentPhase="fixing" passed={false} />
    )
    expect(screen.getByText('validation.fixing')).toBeInTheDocument()
  })

  it('shows passed state with check icon', () => {
    render(
      <ValidationProgress iterations={2} maxIterations={3} currentPhase="validating" passed={true} />
    )
    expect(screen.getByText('validation.passed')).toBeInTheDocument()
    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
  })

  it('shows max retries state with warning icon', () => {
    render(
      <ValidationProgress iterations={3} maxIterations={3} currentPhase="maxRetries" passed={false} />
    )
    expect(screen.getByText('validation.maxRetries')).toBeInTheDocument()
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
  })

  it('shows spinner during validating phase', () => {
    render(
      <ValidationProgress iterations={1} maxIterations={3} currentPhase="validating" passed={false} />
    )
    expect(screen.getByTestId('spinner-icon')).toBeInTheDocument()
  })

  it('renders progress bar', () => {
    render(
      <ValidationProgress iterations={1} maxIterations={3} currentPhase="validating" passed={false} />
    )
    const bar = screen.getByTestId('progress-bar')
    expect(bar).toBeInTheDocument()
  })

  it('renders step dots for each iteration', () => {
    render(
      <ValidationProgress iterations={1} maxIterations={3} currentPhase="validating" passed={false} />
    )
    expect(screen.getByTestId('step-dot-0')).toBeInTheDocument()
    expect(screen.getByTestId('step-dot-1')).toBeInTheDocument()
    expect(screen.getByTestId('step-dot-2')).toBeInTheDocument()
  })

  it('displays iteration count', () => {
    render(
      <ValidationProgress iterations={2} maxIterations={3} currentPhase="fixing" passed={false} />
    )
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })
})
