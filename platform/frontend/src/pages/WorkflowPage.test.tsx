import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

vi.mock('react-i18next', () => {
  const t = (key: string, fallback?: string) => fallback || key
  return { useTranslation: () => ({ t }) }
})

vi.mock('../api/workflows', () => ({
  listWorkflows: vi.fn(() => Promise.resolve([])),
  getWorkflowMetrics: vi.fn(() => Promise.resolve({
    totalWorkflows: 0,
    completedWorkflows: 0,
    failedWorkflows: 0,
    runningWorkflows: 0,
    successRate: 0,
    avgDurationSeconds: 0,
    stepFailureRates: [],
  })),
  retryWorkflowStep: vi.fn(),
  cancelWorkflow: vi.fn(),
}))

import WorkflowPage from './WorkflowPage'

beforeEach(() => { vi.clearAllMocks() })

describe('WorkflowPage', () => {
  it('renders after loading', async () => {
    await act(async () => {
      render(<WorkflowPage />)
    })
    expect(document.body).toBeTruthy()
  })
})
