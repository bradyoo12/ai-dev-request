import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('lucide-react', () => ({
  FileText: (props: any) => <span {...props}>FileText</span>,
  Brain: (props: any) => <span {...props}>Brain</span>,
  ClipboardList: (props: any) => <span {...props}>ClipboardList</span>,
  Hammer: (props: any) => <span {...props}>Hammer</span>,
  CheckCircle: (props: any) => <span {...props}>CheckCircle</span>,
}))

import StepIndicator from './StepIndicator'

describe('StepIndicator', () => {
  it('returns null for form state', () => {
    const { container } = render(<StepIndicator viewState="form" />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null for error state', () => {
    const { container } = render(<StepIndicator viewState="error" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders steps for analyzing state', () => {
    render(<StepIndicator viewState="analyzing" />)
    expect(screen.getByText('wizard.step.request')).toBeInTheDocument()
    expect(screen.getByText('wizard.step.analysis')).toBeInTheDocument()
    expect(screen.getByText('wizard.step.proposal')).toBeInTheDocument()
    expect(screen.getByText('wizard.step.build')).toBeInTheDocument()
    expect(screen.getByText('wizard.step.complete')).toBeInTheDocument()
  })

  it('renders for completed state', () => {
    render(<StepIndicator viewState="completed" />)
    expect(screen.getByText('wizard.step.complete')).toBeInTheDocument()
  })
})
